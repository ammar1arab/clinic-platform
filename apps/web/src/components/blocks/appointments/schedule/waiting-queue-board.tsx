'use client';

import { createPortal } from 'react-dom';
import React, { useMemo, useCallback, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useNow } from '@/hooks/shared/use-now';
import { useDragDrop, type DragSize } from '@/hooks/shared/use-drag-drop';
import { useUpdateAppointment } from '@/hooks/api/use-appointments';
import { extractErrorMessage, type ApiErrorLike } from '@/lib/api';
import {
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  type BadgeVariant,
} from '@/components/ui';
import { Appointment, type AppointmentStatus } from '@/services/appointments.service';
import { AppointmentStatusSelect } from '../shared/appointment-status-select';
import { QueueMoveDialog } from './queue-move-dialog';
import { doctorDisplayName, formatApptTimeRange, patientDisplayName } from '../shared/appointment-display';
import {
  AppointmentPopover,
  popoverAnchorFromElement,
  type AppointmentPopoverState,
} from './appointment-popovers';
import { cn } from '@/lib/utils';
import { EmptyState, PreviewableAvatar, QueueColumnSkeleton } from '@/components/primitives';
import { elapsedMinutesSince, formatWaitingMins } from '@/lib/waiting-time';
import { IconActivate, IconBan, IconCalendarClock, IconCheckCircle, IconCreditCard, IconDeactivate, IconHourglass, IconOnline, IconPlay, IconRoom, IconService, IconTime, IconTimer, IconTodaysAppointments, type LucideIcon } from '@/constants/icons';
import { getBilingualName } from '@/i18n';
import { useAuth, useLanguage } from '@/providers';
import { APPOINTMENT_STATUS, PRESENCE_SOURCE, ROLE, SESSION_TYPE } from '@clinic/types';
import { QUEUE_STAGE, STATUS_BADGE_VARIANT, STATUS_COLORS, STATUS_OPTIONS, getStatusConfig, type QueueStage } from '@/constants/appointment';
import { ROUTES } from '@/constants/routes';
import { visitsService } from '@/services/visits.service';
import { INVALIDATE, useApiMutation } from '@/hooks/query';

const { UNCONFIRMED, CONFIRMED, CHECKED_IN, WAITING, IN_PROGRESS, COMPLETED, NO_SHOW, CANCELLED } = APPOINTMENT_STATUS;

/** Where the workflow lets a card go from each column. Completion happens in the visit page unless the visit can finish now. */
const DROP_TARGETS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  [UNCONFIRMED]: [CONFIRMED, CHECKED_IN, WAITING, IN_PROGRESS, NO_SHOW, CANCELLED],
  [CONFIRMED]: [UNCONFIRMED, CHECKED_IN, WAITING, IN_PROGRESS, NO_SHOW, CANCELLED],
  [CHECKED_IN]: [CONFIRMED, WAITING, IN_PROGRESS, NO_SHOW, CANCELLED],
  [WAITING]: [CONFIRMED, IN_PROGRESS, NO_SHOW, CANCELLED],
  [IN_PROGRESS]: [COMPLETED],
  [COMPLETED]: [],
  [NO_SHOW]: [UNCONFIRMED, CONFIRMED, CANCELLED],
  [CANCELLED]: [],
};

const STATUS_ICONS: Record<AppointmentStatus, LucideIcon> = {
  [UNCONFIRMED]: IconCalendarClock,
  [CONFIRMED]: IconTodaysAppointments,
  [CHECKED_IN]: IconActivate,
  [WAITING]: IconHourglass,
  [IN_PROGRESS]: IconService,
  [COMPLETED]: IconCheckCircle,
  [NO_SHOW]: IconDeactivate,
  [CANCELLED]: IconBan,
};

const UPDATE_TARGETS: readonly AppointmentStatus[] = [UNCONFIRMED, CONFIRMED, NO_SHOW, CANCELLED];
const NEWEST_FIRST: readonly AppointmentStatus[] = [COMPLETED, NO_SHOW, CANCELLED];

const dropAllowed = (status: AppointmentStatus, target: AppointmentStatus) => DROP_TARGETS[status].includes(target);

function queueTime(appt: Appointment) {
  if (appt.status === CHECKED_IN || appt.status === WAITING) return appt.waitingStartedAt || appt.statusUpdatedAt || appt.scheduledAt;
  if (appt.status === IN_PROGRESS) return appt.inProgressAt || appt.statusUpdatedAt || appt.scheduledAt;
  return appt.scheduledAt;
}

type PendingMove = DragSize & { id: string; from: AppointmentStatus; stage: AppointmentStatus };

interface Props {
  appointments: Appointment[] | undefined;
  isLoading: boolean;
  toolbarSlot?: HTMLElement | null;
  stage?: QueueStage;
  onStageChange?: (stage: QueueStage) => void;
  focused?: boolean;
  canManagePayments?: boolean;
  onEventClick: (appointment: Appointment) => void;
}

export function WaitingQueueBoard({
  appointments,
  isLoading,
  toolbarSlot,
  stage,
  onStageChange,
  focused = false,
  canManagePayments = true,
  onEventClick,
}: Props) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [localStage, setLocalStage] = useState<QueueStage>(QUEUE_STAGE.ALL);
  const stageTab = stage ?? localStage;
  const setStageTab = onStageChange ?? setLocalStage;
  const statuses = stageTab === QUEUE_STAGE.ALL ? STATUS_OPTIONS : [stageTab];
  const single = statuses.length === 1;
  const statusConfig = getStatusConfig(t);
  const [appointmentPopover, setAppointmentPopover] =
    useState<AppointmentPopoverState | null>(null);
  const now = useNow(10_000);
  const presence = useApiMutation({
    request: async ({ appointment, waiting, statusReason }: { appointment: Appointment; waiting: boolean; statusReason?: string }) => {
      const online = appointment.sessionType === SESSION_TYPE.ONLINE;
      const source = online
        ? PRESENCE_SOURCE.ONLINE_MANUAL
        : user?.role === ROLE.PRACTITIONER ? PRESENCE_SOURCE.PRACTITIONER : PRESENCE_SOURCE.FRONT_DESK;
      if (!waiting) return visitsService.checkIn(appointment.id, source, statusReason);
      if (online && appointment.status !== CHECKED_IN) await visitsService.checkIn(appointment.id, source);
      return visitsService.markWaiting(appointment.id, statusReason);
    },
    invalidateQueries: [...INVALIDATE.visitWrite],
    successMessage: t.visits.presenceSaved,
  });
  const arrival = (appointment: Appointment) => ({ appointment, waiting: appointment.sessionType !== SESSION_TYPE.ONLINE });

  const updateAppointment = useUpdateAppointment();
  const finishVisit = useApiMutation({
    request: (input: { visitId: string; expectedRevision: number }) => visitsService.finish(input.visitId, input.expectedRevision),
    invalidateQueries: [...INVALIDATE.visitWrite],
  });
  const startVisit = useApiMutation({
    request: ({ appointmentId, statusReason }: { appointmentId: string; statusReason?: string }) =>
      visitsService.start(appointmentId, undefined, statusReason),
    invalidateQueries: [...INVALIDATE.visitWrite],
  });
  const [pending, setPending] = useState<PendingMove | null>(null);
  const [move, setMove] = useState<PendingMove & { appointment: Appointment } | null>(null);
  const [moveNote, setMoveNote] = useState('');
  const moving = pending && appointments?.find((a) => a.id === pending.id)?.status === pending.from ? pending : null;
  const movingId = moving?.id;

  const { drag, bind, zoneProps } = useDragDrop<Appointment>({
    canDrop: (appt, zone) => dropAllowed(appt.status, zone as AppointmentStatus),
    onDrop: (appt, zone, size) => {
      const target = zone as AppointmentStatus;
      if (target === COMPLETED) {
        void completeFromQueue(appt).catch((error: ApiErrorLike) => {
          toast.error(extractErrorMessage(error) || t.appointments.statusUpdateFailed);
        });
        return;
      }
      setMoveNote('');
      setMove({ appointment: appt, id: appt.id, from: appt.status, stage: target, ...size });
    },
  });
  const dragged = drag ? appointments?.find((a) => a.id === drag.id) : undefined;

  const completeFromQueue = async (appointment: Appointment) => {
    const workspace = await visitsService.workspace(appointment.id);
    if (workspace.visitId && workspace.allowedActions.finish) {
      await finishVisit.mutateAsync({ visitId: workspace.visitId, expectedRevision: workspace.visitRevision });
      return;
    }
    router.push(ROUTES.VISIT(appointment.id));
  };

  const runMove = async (appointment: Appointment, target: AppointmentStatus, statusReason?: string) => {
    const { id, status } = appointment;
    if (UPDATE_TARGETS.includes(target)) {
      await updateAppointment.mutateAsync({
        id,
        data: { status: target, statusReason, cancelReason: target === CANCELLED ? statusReason : undefined },
      });
      return;
    }
    if (status === UNCONFIRMED) {
      await updateAppointment.mutateAsync({ id, data: { status: CONFIRMED } });
    }
    if (target === CHECKED_IN || target === WAITING) {
      await presence.mutateAsync({ appointment, waiting: target === WAITING, statusReason });
      return;
    }
    if (status !== CHECKED_IN && status !== WAITING) await presence.mutateAsync(arrival(appointment));
    await startVisit.mutateAsync({ appointmentId: id, statusReason });
  };

  const confirmMove = async () => {
    if (!move) return;
    const { appointment, stage } = move;
    setPending(move);
    setMove(null);
    try {
      await runMove(appointment, stage, moveNote.trim() || undefined);
    } catch (error) {
      toast.error(extractErrorMessage(error as ApiErrorLike) || t.appointments.statusUpdateFailed);
    } finally {
      setPending(null);
    }
  };

  const confirmAppointment = (appt: Appointment) =>
    updateAppointment.mutate(
      { id: appt.id, data: { status: CONFIRMED } },
      { onError: (error) => toast.error(extractErrorMessage(error) || t.appointments.statusUpdateFailed) },
    );

  const slotFor = (status: AppointmentStatus) => {
    const size = drag?.zone === status ? drag : moving?.stage === status ? moving : null;
    return size ? (
      <Skeleton
        className="drop-slot shrink-0 rounded-xl border-2 border-dashed border-primary/40"
        style={{ '--slot-h': `${size.height}px`, height: size.height } as React.CSSProperties}
      />
    ) : null;
  };

  const dayAppointments = useMemo(() => {
    if (!appointments) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    return appointments.filter((appt) => {
      const apptDate = new Date(appt.scheduledAt);
      return appt.id !== movingId && apptDate >= today && apptDate <= endOfDay;
    });
  }, [appointments, movingId]);

  const columns = useMemo(() => {
    const groups = Object.fromEntries(STATUS_OPTIONS.map((status) => [status, [] as Appointment[]])) as Record<AppointmentStatus, Appointment[]>;
    for (const appt of dayAppointments) groups[appt.status]?.push(appt);
    for (const status of STATUS_OPTIONS) {
      const order = NEWEST_FIRST.includes(status) ? -1 : 1;
      groups[status].sort((a, b) => (new Date(queueTime(a)).getTime() - new Date(queueTime(b)).getTime()) * order);
    }
    return groups;
  }, [dayAppointments]);

  const trackId = useId();
  const trackNode = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState({ overflow: false, start: 0, size: 100 });
  const trackRef = useCallback((node: HTMLDivElement | null) => {
    trackNode.current = node;
    if (!node || single) return;
    const sync = () => {
      const { scrollWidth, clientWidth, scrollLeft } = node;
      const offset = getComputedStyle(node).direction === 'rtl' ? scrollWidth - clientWidth + scrollLeft : scrollLeft;
      const next = { overflow: scrollWidth > clientWidth + 1, start: (offset / scrollWidth) * 100, size: (clientWidth / scrollWidth) * 100 };
      setView((prev) =>
        prev.overflow === next.overflow && Math.abs(prev.start - next.start) < 0.1 && Math.abs(prev.size - next.size) < 0.1 ? prev : next,
      );
    };
    sync();
    node.addEventListener('scroll', sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => {
      node.removeEventListener('scroll', sync);
      observer.disconnect();
    };
  }, [single]);

  const scrub = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = trackNode.current;
    if (!node || event.button !== 0) return;
    const map = event.currentTarget;
    const rect = map.getBoundingClientRect();
    const fraction = (x: number) => (x - rect.left) / rect.width;
    const win = { start: view.start / 100, size: view.size / 100 };
    const pressed = fraction(event.clientX);
    const grab = pressed >= win.start && pressed <= win.start + win.size ? pressed - (win.start + win.size / 2) : 0;
    const seek = (x: number) => {
      const max = node.scrollWidth - node.clientWidth;
      const offset = Math.min(max, Math.max(0, (fraction(x) - grab) * node.scrollWidth - node.clientWidth / 2));
      node.scrollLeft = getComputedStyle(node).direction === 'rtl' ? offset - max : offset;
    };
    const move = (moveEvent: PointerEvent) => seek(moveEvent.clientX);
    const end = () => {
      document.body.classList.remove('is-dragging');
      map.removeEventListener('pointermove', move);
      map.removeEventListener('pointerup', end);
      map.removeEventListener('pointercancel', end);
    };
    map.setPointerCapture(event.pointerId);
    document.body.classList.add('is-dragging');
    seek(event.clientX);
    map.addEventListener('pointermove', move);
    map.addEventListener('pointerup', end);
    map.addEventListener('pointercancel', end);
  };

  const nudge = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!step || !trackNode.current) return;
    event.preventDefault();
    trackNode.current.scrollBy({ left: step * trackNode.current.clientWidth * 0.6 });
  };

  const loading = isLoading && !appointments?.length;

  const withCount = (name: string, count: number) => (loading ? name : `${name} (${count})`);

  const stageOptions: { key: QueueStage; label: string }[] = [
    { key: QUEUE_STAGE.ALL, label: t.queue.allStages },
    ...STATUS_OPTIONS.map((status) => ({ key: status, label: withCount(statusConfig[status].label, columns[status].length) })),
  ];

  const emptyText: Record<AppointmentStatus, string> = {
    [UNCONFIRMED]: t.queue.noUpcomingVisitsToday,
    [CONFIRMED]: t.queue.noUpcomingVisitsToday,
    [CHECKED_IN]: t.queue.noPatientsWaiting,
    [WAITING]: t.queue.noPatientsWaiting,
    [IN_PROGRESS]: t.queue.noConsultationsInSession,
    [COMPLETED]: t.queue.noCompletedVisitsToday,
    [NO_SHOW]: t.queue.noClosedVisitsToday,
    [CANCELLED]: t.queue.noClosedVisitsToday,
  };

  const statusMenu = (appt: Appointment) => (
    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
      <AppointmentStatusSelect appointment={appt} compact />
    </div>
  );

  const timeBadge = (appt: Appointment) => (
    <Badge variant="muted" className="min-w-0 shrink font-semibold">
      <IconTime className="size-3" />
      <span>{formatApptTimeRange(appt, lang)}</span>
    </Badge>
  );

  const cardBody = (appt: Appointment) => {
    switch (appt.status) {
      case UNCONFIRMED:
      case CONFIRMED:
        return (
          <>
            <div className="flex items-center justify-between gap-2">
              {timeBadge(appt)}
              {statusMenu(appt)}
            </div>
            <div className="mt-3">
              {appt.status === UNCONFIRMED ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full font-semibold hover:bg-primary/10 hover:text-primary active:scale-[0.98] transition-all"
                  disabled={updateAppointment.isPending}
                  onClick={(e) => { e.stopPropagation(); confirmAppointment(appt); }}
                >
                  <IconCheckCircle className="me-1.5 size-3.5 text-primary" />
                  {t.common.confirm}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full font-semibold hover:bg-primary/10 hover:text-primary active:scale-[0.98] transition-all"
                  disabled={presence.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    presence.mutate(arrival(appt), {
                      onError: (error) => toast.error(extractErrorMessage(error) || t.appointments.statusUpdateFailed),
                    });
                  }}
                >
                  <IconActivate className="me-1.5 size-3.5 text-primary" />
                  {t.queue.patientArrived}
                </Button>
              )}
            </div>
          </>
        );
      case CHECKED_IN:
      case WAITING: {
        const waitMins = elapsedMinutesSince(queueTime(appt), now);
        const timerVariant = waitMins >= 25 ? 'destructive' : waitMins >= 12 ? 'warning' : 'success';
        const waitLabel = waitMins >= 25 ? t.queue.longWait : waitMins >= 12 ? t.queue.moderateWait : t.queue.onTrack;
        return (
          <>
            <div className="flex items-center justify-between gap-2">
              <Badge variant={timerVariant} className={cn('min-w-0 shrink font-semibold', waitMins >= 25 && 'animate-pulse')}>
                <IconTime className="size-3" />
                <span>{formatWaitingMins(waitMins, t)} · {waitLabel}</span>
              </Badge>
              {statusMenu(appt)}
            </div>
            <div className="mt-3">
              <Button
                size="sm"
                className="w-full font-bold shadow-xs transition-all active:scale-[0.98]"
                onClick={(e) => { e.stopPropagation(); router.push(ROUTES.VISIT(appt.id)); }}
              >
                <IconPlay className="me-1.5 size-3.5 fill-current" />
                {t.queue.startConsultation}
              </Button>
            </div>
          </>
        );
      }
      case IN_PROGRESS: {
        const sessionMins = elapsedMinutesSince(queueTime(appt), now);
        const isLong = sessionMins > appt.durationMins;
        return (
          <>
            <div className="flex items-center justify-between gap-2">
              <Badge
                variant={isLong ? 'destructive' : 'info'}
                className={cn('min-w-0 shrink font-semibold', isLong && 'animate-pulse')}
              >
                <IconTimer className="size-3 animate-spin" />
                <span>{formatWaitingMins(sessionMins, t)} / {appt.durationMins}{t.appointments.minutesShort}</span>
              </Badge>
              {statusMenu(appt)}
            </div>
            <div className="mt-3">
              <Button
                size="sm"
                className="w-full font-bold shadow-xs transition-all active:scale-[0.98]"
                onClick={(e) => { e.stopPropagation(); router.push(ROUTES.VISIT(appt.id)); }}
              >
                <IconCheckCircle className="me-1.5 size-3.5" />
                {t.queue.finishConsultation}
              </Button>
            </div>
          </>
        );
      }
      case COMPLETED:
        return (
          <>
            <div className="flex items-center justify-between gap-2">
              <Badge variant="success" className="min-w-0 shrink font-semibold">
                <IconCheckCircle className="size-3" />
                <span>{t.appointments.markCompleted}</span>
              </Badge>
              {statusMenu(appt)}
            </div>
            {canManagePayments ? (
              <div className="mt-2.5 flex items-center justify-between gap-2 border-t pt-2 text-2xs">
                <span className="font-medium text-muted-foreground">{t.appointments.paymentStatus}:</span>
                {appt.isPaid ? (
                  <Badge variant="success"><IconCreditCard className="size-3" />{t.appointments.paid}</Badge>
                ) : (
                  <Badge asChild variant="warning">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(ROUTES.VISIT(appt.id));
                      }}
                      className="cursor-pointer"
                    >
                      <IconCreditCard className="size-3" />
                      {t.appointments.unpaid} · {t.visits.openVisit}
                    </button>
                  </Badge>
                )}
              </div>
            ) : null}
          </>
        );
      default:
        return (
          <div className="flex items-center justify-between gap-2">
            {timeBadge(appt)}
            {statusMenu(appt)}
          </div>
        );
    }
  };

  return (
    <div
      data-schedule-host=""
      aria-busy={loading || undefined}
      className={cn(
        'relative page-fill-always overflow-hidden',
        single ? 'bg-card' : 'border bg-card shadow-xs',
        !single && 'card-aura rounded-xl sm:rounded-2xl',
      )}
    >
      {toolbarSlot ? createPortal(
        <Select value={stageTab} onValueChange={(value) => setStageTab(value as QueueStage)}>
          <SelectTrigger size="sm" aria-label={t.queue.waitingQueue} className="h-8 w-full">
            <span className="min-w-0 flex-1 truncate text-start">
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {stageOptions.map(({ key, label }) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
          </SelectContent>
        </Select>,
        toolbarSlot,
      ) : null}
      <div
        ref={trackRef}
        id={trackId}
        data-drag-scroll="x"
        className={cn(
          'flex min-h-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain',
          !single && 'snap-x snap-mandatory lg:snap-proximity',
          !single && (focused
            ? 'gap-2 p-1.5 scroll-px-1.5 sm:p-2 sm:scroll-px-2'
            : 'gap-2.5 p-2.5 scroll-px-2.5 sm:gap-3 sm:p-3 sm:scroll-px-3'),
          focused && 'h-0',
          !single && view.overflow && 'pb-1.5 sm:pb-2',
        )}
      >
        {statuses.map((status) => {
          const list = columns[status];
          const placeholder = slotFor(status);
          return (
            <StageColumn
              key={status}
              single={single}
              zoneProps={zoneProps(status)}
              over={drag?.zone === status}
              blocked={!!dragged && dragged.status !== status && !dropAllowed(dragged.status, status)}
              placeholder={placeholder}
              title={statusConfig[status].label}
              count={loading ? undefined : list.length}
              dotClassName={statusConfig[status].dotClassName}
              icon={STATUS_ICONS[status]}
              color={STATUS_COLORS[status]}
              badgeVariant={STATUS_BADGE_VARIANT[status]}
            >
              {loading ? <QueueColumnSkeleton count={3} /> : list.length === 0 && !placeholder ? (
                <EmptyState framed={false} icon={STATUS_ICONS[status]} title={emptyText[status]} className="flex-1 px-3 py-8" />
              ) : (
                list.map((appt) => (
                  <QueueCard
                    key={appt.id}
                    appointment={appt}
                    dragging={drag?.id === appt.id}
                    {...bind(appt, appt.id)}
                    onClick={(event) => setAppointmentPopover({ appointment: appt, anchor: popoverAnchorFromElement(event.currentTarget) })}
                  >
                    {cardBody(appt)}
                  </QueueCard>
                ))
              )}
            </StageColumn>
          );
        })}
      </div>
      {!single && view.overflow ? (
        <div className="flex shrink-0 justify-center pb-1.5 sm:pb-2">
          <div
            role="scrollbar"
            aria-controls={trackId}
            aria-label={t.queue.waitingQueue}
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(view.start)}
            tabIndex={0}
            onPointerDown={scrub}
            onKeyDown={nudge}
            className="group w-20 cursor-grab touch-none select-none py-1.5 outline-none active:cursor-grabbing sm:w-28"
          >
            <div className="relative h-1 rounded-full bg-foreground/10 transition-[height] duration-200 group-hover:h-1.5 group-focus-visible:ring-2 group-focus-visible:ring-ring group-active:h-1.5">
              <span
                aria-hidden
                className="absolute inset-y-0 min-w-2 rounded-full bg-primary/60 transition-colors duration-200 group-hover:bg-primary group-active:bg-primary"
                style={{ left: `${view.start}%`, width: `${view.size}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {appointmentPopover ? (
        <AppointmentPopover
          key={appointmentPopover.appointment.id}
          state={appointmentPopover}
          onClose={() => setAppointmentPopover(null)}
          onExpand={(appt) => {
            setAppointmentPopover(null);
            onEventClick(appt);
          }}
        />
      ) : null}
      <QueueMoveDialog
        open={!!move}
        name={move ? patientDisplayName(move.appointment, lang) : ''}
        destination={move ? statusConfig[move.stage].label : ''}
        note={moveNote}
        pending={presence.isPending || startVisit.isPending || updateAppointment.isPending}
        closing={move?.stage === CANCELLED}
        onNoteChange={setMoveNote}
        onCancel={() => setMove(null)}
        onConfirm={() => void confirmMove()}
      />
    </div>
  );
}

function StageColumn({
  single,
  zoneProps,
  over,
  blocked,
  placeholder,
  title,
  count,
  dotClassName,
  icon: Icon,
  color,
  badgeVariant,
  children,
}: {
  single: boolean;
  zoneProps: { 'data-drop-zone': string };
  over: boolean;
  blocked: boolean;
  placeholder: React.ReactNode;
  title: string;
  count: number | undefined;
  dotClassName: string;
  icon: LucideIcon;
  color: string;
  badgeVariant: BadgeVariant;
  children: React.ReactNode;
}) {
  return (
    <section
      {...zoneProps}
      data-board-column=""
      aria-label={title}
      className={cn(
        'card-aura flex min-h-0 shrink-0 flex-col overflow-hidden rounded-xl border bg-card/75 shadow-xs backdrop-blur-xs transition-[opacity,box-shadow] duration-200 sm:rounded-2xl',
        single ? 'w-full' : 'w-[85%] snap-start sm:w-72 lg:w-auto lg:min-w-68 lg:flex-1',
        over && 'ring-2 ring-primary/40',
        blocked && 'opacity-40',
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-muted/25 p-2.5 sm:p-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('size-2 shrink-0 rounded-full ring-2 ring-background', dotClassName)} />
          <Icon className="size-4 shrink-0" style={{ color }} />
          <h3 className="truncate text-xs font-bold tracking-tight text-foreground">{title}</h3>
        </div>
        <Badge variant={badgeVariant} className="font-bold tabular-nums">
          {count === undefined ? <Skeleton className="h-4 w-4" /> : count}
        </Badge>
      </div>
      <div data-drag-scroll="y" className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain p-2.5 sm:p-3">
        <div className="flex min-h-full flex-1 flex-col gap-2.5">{children}{placeholder}</div>
      </div>
    </section>
  );
}

function QueueCard({
  appointment: appt,
  onClick,
  dragging = false,
  children,
  ...dragProps
}: {
  appointment: Appointment;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  dragging?: boolean;
  children: React.ReactNode;
} & Pick<React.ComponentProps<'div'>, 'ref' | 'onPointerDown' | 'onClickCapture'>) {
  const { t, lang } = useLanguage();
  const docLabel = doctorDisplayName(appt.doctor, lang);

  return (
    <div
      {...dragProps}
      onClick={onClick}
      data-queue-card=""
      className={cn(
        'group relative flex shrink-0 cursor-pointer select-none flex-col rounded-xl border bg-card p-3 shadow-xs transition-[border-color,box-shadow,opacity] duration-200 [-webkit-touch-callout:none] hover:border-primary/40 hover:shadow-md sm:p-3.5',
        dragging && 'opacity-40',
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold break-words text-foreground group-hover:text-primary transition-colors">
            {patientDisplayName(appt, lang)}
          </p>
          <p className="mt-0.5 text-2xs text-muted-foreground font-medium flex items-center gap-1">
            <IconTime className="size-2.5" />
            {formatApptTimeRange(appt, lang)}
          </p>
        </div>
        <div onClick={(event) => event.stopPropagation()}>
          <PreviewableAvatar src={appt.doctor.imageUrl} seed={appt.doctor.id} size="sm" className="size-7" />
        </div>
      </div>

      <div className="mb-2.5 flex flex-col gap-1 text-2xs text-muted-foreground">
        <div className="flex items-start gap-1.5">
          <IconService className="mt-0.5 size-3 shrink-0 text-primary" />
          <span className="min-w-0 break-words font-medium text-foreground/90">
            {docLabel} · {appt.service ? getBilingualName(appt.service.name, appt.service.nameAr, lang) : t.appointments.generalVisit}
          </span>
        </div>
        {appt.sessionType === 'online' ? (
          <div className="flex items-center gap-1.5 text-primary font-medium">
            <IconOnline className="size-3 shrink-0" />
            <span>{t.appointments.onlineSession}</span>
          </div>
        ) : (
          appt.room && (
            <div className="flex items-center gap-1.5">
              <IconRoom className="size-3 shrink-0" />
              <span>{t.appointments.room}: {getBilingualName(appt.room.name, appt.room.nameAr, lang)}</span>
            </div>
          )
        )}
      </div>

      {children}
    </div>
  );
}
