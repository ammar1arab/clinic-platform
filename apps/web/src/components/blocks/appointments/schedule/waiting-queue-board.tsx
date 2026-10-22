'use client';

import { createPortal } from 'react-dom';
import React, { useMemo, useCallback, useState } from 'react';
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
import { doctorDisplayName, formatApptTimeRange, patientDisplayName } from '../shared/appointment-display';
import { STATUS_COLORS } from '../shared/status-badge';
import {
  AppointmentPopover,
  popoverAnchorFromElement,
  type AppointmentPopoverState,
} from './appointment-popovers';
import { cn } from '@/lib/utils';
import { EmptyState, PreviewableAvatar, QueueColumnSkeleton, SoftTip } from '@/components/primitives';
import { elapsedMinutesSince, formatWaitingMins } from '@/lib/waiting-time';
import { IconActivate, IconBan, IconCalendarClock, IconCheckCircle, IconCreditCard, IconOnline, IconPatients, IconPlay, IconRoom, IconService, IconTime, IconTimer } from '@/constants/icons';
import { getBilingualName } from '@/i18n';
import { useLanguage } from '@/providers';
import { APPOINTMENT_STATUS, PRESENCE_SOURCE, SESSION_TYPE } from '@clinic/types';
import { QUEUE_STAGE, type QueueStage } from '@/constants/appointment';
import { ROUTES } from '@/constants/routes';
import { visitsService } from '@/services/visits.service';
import { INVALIDATE, useApiMutation } from '@/hooks/query';

const STAGE_OF: Record<AppointmentStatus, QueueStage> = {
  [APPOINTMENT_STATUS.UNCONFIRMED]: QUEUE_STAGE.UPCOMING,
  [APPOINTMENT_STATUS.CONFIRMED]: QUEUE_STAGE.UPCOMING,
  [APPOINTMENT_STATUS.CHECKED_IN]: QUEUE_STAGE.WAITING,
  [APPOINTMENT_STATUS.WAITING]: QUEUE_STAGE.WAITING,
  [APPOINTMENT_STATUS.IN_PROGRESS]: QUEUE_STAGE.IN_PROGRESS,
  [APPOINTMENT_STATUS.COMPLETED]: QUEUE_STAGE.COMPLETED,
  [APPOINTMENT_STATUS.NO_SHOW]: QUEUE_STAGE.CLOSED,
  [APPOINTMENT_STATUS.CANCELLED]: QUEUE_STAGE.CLOSED,
};

type DropReason = 'dropLocked' | 'dropClosed' | 'dropConfirmFirst' | 'dropArriveFirst' | 'dropFinishInVisit' | 'dropInSession' | 'dropUseStatusMenu';

/** `null` means the move is allowed, `'same'` means the card is already there. */
function dropVerdict(status: AppointmentStatus, stage: QueueStage): DropReason | 'same' | null {
  if (STAGE_OF[status] === stage) return 'same';
  if (status === APPOINTMENT_STATUS.COMPLETED) return 'dropLocked';
  if (STAGE_OF[status] === QUEUE_STAGE.CLOSED) return 'dropClosed';
  if (stage === QUEUE_STAGE.CLOSED) return 'dropUseStatusMenu';
  if (stage === QUEUE_STAGE.COMPLETED) return 'dropFinishInVisit';
  if (status === APPOINTMENT_STATUS.IN_PROGRESS) return 'dropInSession';
  const arrived = STAGE_OF[status] === QUEUE_STAGE.WAITING;
  if (stage === QUEUE_STAGE.UPCOMING) return null;
  if (status === APPOINTMENT_STATUS.UNCONFIRMED) return 'dropConfirmFirst';
  if (stage === QUEUE_STAGE.IN_PROGRESS && !arrived) return 'dropArriveFirst';
  return null;
}

type PendingMove = DragSize & { id: string; from: AppointmentStatus; stage: QueueStage };

interface Props {
  appointments: Appointment[] | undefined;
  isLoading: boolean;
  toolbarSlot?: HTMLElement | null;
  focused?: boolean;
  canManagePayments?: boolean;
  onEventClick: (appointment: Appointment) => void;
}

export function WaitingQueueBoard({
  appointments,
  isLoading,
  toolbarSlot,
  focused = false,
  canManagePayments = true,
  onEventClick,
}: Props) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [stageTab, setStageTab] = useState<QueueStage>(QUEUE_STAGE.ALL);
  const [appointmentPopover, setAppointmentPopover] =
    useState<AppointmentPopoverState | null>(null);
  const now = useNow(10_000);
  const markWaiting = useApiMutation({
    request: (appointment: Appointment) =>
      appointment.sessionType === SESSION_TYPE.ONLINE
        ? visitsService.checkIn(appointment.id, PRESENCE_SOURCE.ONLINE_MANUAL)
        : visitsService.markWaiting(appointment.id),
    invalidateQueries: [...INVALIDATE.visitWrite],
    successMessage: t.visits.presenceSaved,
  });

  const updateAppointment = useUpdateAppointment();
  const startVisit = useApiMutation({
    request: (appointmentId: string) => visitsService.start(appointmentId),
    invalidateQueries: [...INVALIDATE.visitWrite],
  });
  const [pending, setPending] = useState<PendingMove | null>(null);
  const moving = pending && appointments?.find((a) => a.id === pending.id)?.status === pending.from ? pending : null;
  const movingId = moving?.id;

  const { drag, bind, zoneProps } = useDragDrop<Appointment>({
    canDrop: (appt, stage) => dropVerdict(appt.status, stage as QueueStage) === null,
    onReject: (appt, stage) => {
      const verdict = dropVerdict(appt.status, stage as QueueStage);
      if (verdict && verdict !== 'same') toast.error(t.queue[verdict]);
    },
    onDrop: (appt, zone, size) => {
      const stage = zone as QueueStage;
      const onError = (error: ApiErrorLike) => {
        setPending(null);
        toast.error(extractErrorMessage(error) || t.appointments.statusUpdateFailed);
      };
      setPending({ id: appt.id, from: appt.status, stage, ...size });
      if (stage === QUEUE_STAGE.WAITING) markWaiting.mutate(appt, { onError });
      else if (stage === QUEUE_STAGE.IN_PROGRESS) startVisit.mutate(appt.id, { onError });
      else updateAppointment.mutate({ id: appt.id, data: { status: APPOINTMENT_STATUS.CONFIRMED } }, { onError });
    },
  });

  const slotFor = (stage: QueueStage) => {
    const size = drag?.zone === stage ? drag : moving?.stage === stage ? moving : null;
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

  const waitingList = useMemo(
    () =>
      dayAppointments
        .filter((a) => a.status === APPOINTMENT_STATUS.WAITING || a.status === APPOINTMENT_STATUS.CHECKED_IN)
        .sort((a, b) => {
          const aTime = new Date(a.waitingStartedAt || a.statusUpdatedAt || a.scheduledAt).getTime();
          const bTime = new Date(b.waitingStartedAt || b.statusUpdatedAt || b.scheduledAt).getTime();
          return aTime - bTime;
        }),
    [dayAppointments],
  );

  const inProgressList = useMemo(
    () =>
      dayAppointments
        .filter((a) => a.status === APPOINTMENT_STATUS.IN_PROGRESS)
        .sort((a, b) => {
          const aTime = new Date(a.inProgressAt || a.statusUpdatedAt || a.scheduledAt).getTime();
          const bTime = new Date(b.inProgressAt || b.statusUpdatedAt || b.scheduledAt).getTime();
          return aTime - bTime;
        }),
    [dayAppointments],
  );

  const upcomingList = useMemo(
    () =>
      dayAppointments
        .filter((a) => a.status === APPOINTMENT_STATUS.CONFIRMED || a.status === APPOINTMENT_STATUS.UNCONFIRMED)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [dayAppointments],
  );

  const completedList = useMemo(
    () =>
      dayAppointments
        .filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED)
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
    [dayAppointments],
  );

  const closedList = useMemo(
    () =>
      dayAppointments
        .filter((a) => STAGE_OF[a.status] === QUEUE_STAGE.CLOSED)
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
    [dayAppointments],
  );

  const isVisible = useCallback(
    (stage: QueueStage) => stageTab === QUEUE_STAGE.ALL || stageTab === stage,
    [stageTab],
  );

  const loading = isLoading && !appointments?.length;

  const withCount = (name: string, count: number) => (loading ? name : `${name} (${count})`);

  const stageTabs: {
    key: QueueStage;
    label: string;
    short: string;
    icon: React.ReactNode;
    variant: BadgeVariant;
  }[] = [
    { key: QUEUE_STAGE.ALL, label: t.common.all, short: t.common.all, icon: null, variant: 'default' },
    {
      key: QUEUE_STAGE.WAITING,
      label: withCount(t.queue.waiting, waitingList.length),
      short: withCount(t.queue.waiting, waitingList.length),
      icon: <IconTimer className="size-3" />,
      variant: 'warning',
    },
    {
      key: QUEUE_STAGE.IN_PROGRESS,
      label: withCount(t.queue.inSession, inProgressList.length),
      short: withCount(t.queue.inSession, inProgressList.length),
      icon: <IconService className="size-3" />,
      variant: 'info',
    },
    {
      key: QUEUE_STAGE.UPCOMING,
      label: withCount(t.queue.upcomingToday, upcomingList.length),
      short: withCount(t.queue.upcomingToday, upcomingList.length),
      icon: <IconPatients className="size-3" />,
      variant: 'muted',
    },
    {
      key: QUEUE_STAGE.COMPLETED,
      label: withCount(t.queue.completed, completedList.length),
      short: withCount(t.queue.completed, completedList.length),
      icon: <IconCheckCircle className="size-3" />,
      variant: 'success',
    },
    {
      key: QUEUE_STAGE.CLOSED,
      label: withCount(t.queue.cancelledStage, closedList.length),
      short: withCount(t.queue.cancelledStage, closedList.length),
      icon: <IconBan className="size-3" />,
      variant: 'destructive',
    },
  ];

  const slot = toolbarSlot;

  return (
    <div
      data-schedule-host=""
      aria-busy={loading || undefined}
      className={cn(
        'relative page-fill flex-1 min-h-0 overflow-hidden border bg-card shadow-xs',
        focused ? 'rounded-none border-0' : 'card-aura rounded-xl sm:rounded-2xl',
      )}
    >
      {slot ? createPortal(
        <Select value={stageTab} onValueChange={(value) => setStageTab(value as QueueStage)}>
          <SelectTrigger size="sm" aria-label={t.queue.waitingQueue} className="h-8 min-w-[9rem] flex-1 bg-background/50 sm:w-52 sm:max-w-56 sm:flex-none">
            <span className="min-w-0 flex-1 truncate text-start">
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {stageTabs.map(({ key, label }) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
          </SelectContent>
        </Select>,
        slot,
      ) : null}
      <div
        className={cn(
          'grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-y-auto overscroll-y-contain p-2.5',
          focused && 'h-0',
          focused ? 'px-0 pb-2 pt-0 sm:gap-2 md:gap-2' : 'sm:gap-3 sm:p-3 md:gap-4 md:p-4',
          stageTab === QUEUE_STAGE.ALL
            ? 'lg:grid-flow-col lg:auto-cols-[minmax(14rem,1fr)] lg:overflow-x-auto lg:overflow-y-hidden'
            : 'lg:grid-cols-1 lg:overflow-hidden',
          'lg:grid-rows-[minmax(0,1fr)] lg:items-stretch',
        )}
      >
        {isVisible(QUEUE_STAGE.WAITING) && (
          <StageColumn
            roomy={stageTab === QUEUE_STAGE.ALL}
            zoneProps={zoneProps(QUEUE_STAGE.WAITING)}
            over={drag?.zone === QUEUE_STAGE.WAITING}
            placeholder={slotFor(QUEUE_STAGE.WAITING)}
            title={t.queue.waiting}
            count={loading ? undefined : waitingList.length}
            accentClass="bg-warning"
            badgeVariant="warning"
            icon={<IconTimer className="size-4 text-warning" />}
          >
            {loading ? <QueueColumnSkeleton /> : waitingList.length === 0 && !slotFor(QUEUE_STAGE.WAITING) ? (
              <EmptyState
                icon={IconTimer}
                title={t.queue.noPatientsWaiting}
                className="min-h-72 px-3 py-8"
              />
            ) : (
              waitingList.map((appt) => {
                const waitMins = elapsedMinutesSince(
                  appt.waitingStartedAt || appt.statusUpdatedAt || appt.scheduledAt,
                  now,
                );
                const timerVariant =
                  waitMins >= 25 ? 'destructive' : waitMins >= 12 ? 'warning' : 'success';
                const waitLabel = waitMins >= 25 ? t.queue.longWait : waitMins >= 12 ? t.queue.moderateWait : t.queue.onTrack;

                return (
                  <QueueCard key={appt.id} appointment={appt} dragging={drag?.id === appt.id} {...bind(appt, appt.id)} onClick={(event) => setAppointmentPopover({ appointment: appt, anchor: popoverAnchorFromElement(event.currentTarget) })}>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={timerVariant} className={cn('min-w-0 shrink font-semibold', waitMins >= 25 && 'animate-pulse')}>
                        <IconTime className="size-3" />
                        <span>{formatWaitingMins(waitMins, t)} · {waitLabel}</span>
                      </Badge>
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <AppointmentStatusSelect appointment={appt} compact />
                      </div>
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
                  </QueueCard>
                );
              })
            )}
          </StageColumn>
        )}

        {isVisible(QUEUE_STAGE.IN_PROGRESS) && (
          <StageColumn
            roomy={stageTab === QUEUE_STAGE.ALL}
            zoneProps={zoneProps(QUEUE_STAGE.IN_PROGRESS)}
            over={drag?.zone === QUEUE_STAGE.IN_PROGRESS}
            placeholder={slotFor(QUEUE_STAGE.IN_PROGRESS)}
            title={t.queue.inSession}
            count={loading ? undefined : inProgressList.length}
            accentClass="bg-primary"
            badgeVariant="info"
            icon={<IconService className="size-4 text-primary" />}
          >
            {loading ? <QueueColumnSkeleton /> : inProgressList.length === 0 && !slotFor(QUEUE_STAGE.IN_PROGRESS) ? (
              <EmptyState
                icon={IconService}
                title={t.queue.noConsultationsInSession}
                className="min-h-72 px-3 py-8"
              />
            ) : (
              inProgressList.map((appt) => {
                const sessionMins = elapsedMinutesSince(
                  appt.inProgressAt || appt.statusUpdatedAt || appt.scheduledAt,
                  now,
                );
                const isLong = sessionMins > appt.durationMins;

                return (
                  <QueueCard key={appt.id} appointment={appt} dragging={drag?.id === appt.id} {...bind(appt, appt.id)} onClick={(event) => setAppointmentPopover({ appointment: appt, anchor: popoverAnchorFromElement(event.currentTarget) })}>
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={isLong ? 'destructive' : 'info'}
                        className={cn('min-w-0 shrink font-semibold', isLong && 'animate-pulse')}
                      >
                        <IconTimer className="size-3 animate-spin" />
                        <span>{formatWaitingMins(sessionMins, t)} / {appt.durationMins}{t.appointments.minutesShort}</span>
                      </Badge>
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <AppointmentStatusSelect appointment={appt} compact />
                      </div>
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
                  </QueueCard>
                );
              })
            )}
          </StageColumn>
        )}

        {isVisible(QUEUE_STAGE.UPCOMING) && (
          <StageColumn
            roomy={stageTab === QUEUE_STAGE.ALL}
            zoneProps={zoneProps(QUEUE_STAGE.UPCOMING)}
            over={drag?.zone === QUEUE_STAGE.UPCOMING}
            placeholder={slotFor(QUEUE_STAGE.UPCOMING)}
            title={t.queue.upcomingToday}
            count={loading ? undefined : upcomingList.length}
            accentClass="bg-muted-foreground"
            badgeVariant="muted"
            icon={<IconCalendarClock className="size-4 text-muted-foreground" />}
          >
            {loading ? <QueueColumnSkeleton /> : upcomingList.length === 0 && !slotFor(QUEUE_STAGE.UPCOMING) ? (
              <EmptyState
                icon={IconCalendarClock}
                title={t.queue.noUpcomingVisitsToday}
                className="min-h-72 px-3 py-8"
              />
            ) : (
              upcomingList.map((appt) => (
                <QueueCard key={appt.id} appointment={appt} dragging={drag?.id === appt.id} {...bind(appt, appt.id)} onClick={(event) => setAppointmentPopover({ appointment: appt, anchor: popoverAnchorFromElement(event.currentTarget) })}>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="muted" className="min-w-0 shrink font-semibold">
                      <IconTime className="size-3" />
                      <span>{formatApptTimeRange(appt, lang)}</span>
                    </Badge>
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <AppointmentStatusSelect appointment={appt} compact />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full font-semibold hover:bg-primary/10 hover:text-primary active:scale-[0.98] transition-all"
                      disabled={markWaiting.isPending}
                      onClick={(e) => { e.stopPropagation(); markWaiting.mutate(appt); }}
                    >
                      <IconActivate className="me-1.5 size-3.5 text-primary" />
                      {t.queue.patientArrived}
                    </Button>
                  </div>
                </QueueCard>
              ))
            )}
          </StageColumn>
        )}

        {isVisible(QUEUE_STAGE.COMPLETED) && (
          <StageColumn
            roomy={stageTab === QUEUE_STAGE.ALL}
            zoneProps={zoneProps(QUEUE_STAGE.COMPLETED)}
            over={drag?.zone === QUEUE_STAGE.COMPLETED}
            placeholder={slotFor(QUEUE_STAGE.COMPLETED)}
            title={t.queue.completed}
            count={loading ? undefined : completedList.length}
            accentClass="bg-success"
            badgeVariant="success"
            icon={<IconCheckCircle className="size-4 text-success" />}
          >
            {loading ? <QueueColumnSkeleton /> : completedList.length === 0 && !slotFor(QUEUE_STAGE.COMPLETED) ? (
              <EmptyState
                icon={IconCheckCircle}
                title={t.queue.noCompletedVisitsToday}
                className="min-h-72 px-3 py-8"
              />
            ) : (
              completedList.map((appt) => (
                <QueueCard key={appt.id} appointment={appt} dragging={drag?.id === appt.id} {...bind(appt, appt.id)} onClick={(event) => setAppointmentPopover({ appointment: appt, anchor: popoverAnchorFromElement(event.currentTarget) })}>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="success" className="min-w-0 shrink font-semibold">
                      <IconCheckCircle className="size-3" />
                      <span>{t.appointments.markCompleted}</span>
                    </Badge>
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <AppointmentStatusSelect appointment={appt} compact />
                    </div>
                  </div>

                    {canManagePayments ? (
                      <div className="mt-2.5 flex items-center justify-between border-t pt-2 text-2xs">
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
                </QueueCard>
              ))
            )}
          </StageColumn>
        )}

        {isVisible(QUEUE_STAGE.CLOSED) && (
          <StageColumn
            roomy={stageTab === QUEUE_STAGE.ALL}
            zoneProps={zoneProps(QUEUE_STAGE.CLOSED)}
            over={drag?.zone === QUEUE_STAGE.CLOSED}
            placeholder={slotFor(QUEUE_STAGE.CLOSED)}
            title={t.queue.cancelledStage}
            count={loading ? undefined : closedList.length}
            accentClass="bg-destructive"
            badgeVariant="destructive"
            icon={<IconBan className="size-4 text-destructive" />}
          >
            {loading ? <QueueColumnSkeleton /> : closedList.length === 0 && !slotFor(QUEUE_STAGE.CLOSED) ? (
              <EmptyState
                icon={IconBan}
                title={t.queue.noClosedVisitsToday}
                className="min-h-72 px-3 py-8"
              />
            ) : (
              closedList.map((appt) => (
                <QueueCard key={appt.id} appointment={appt} dragging={drag?.id === appt.id} {...bind(appt, appt.id)} onClick={(event) => setAppointmentPopover({ appointment: appt, anchor: popoverAnchorFromElement(event.currentTarget) })}>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="muted" className="min-w-0 shrink font-semibold">
                      <IconTime className="size-3" />
                      <span>{formatApptTimeRange(appt, lang)}</span>
                    </Badge>
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <AppointmentStatusSelect appointment={appt} compact />
                    </div>
                  </div>
                </QueueCard>
              ))
            )}
          </StageColumn>
        )}
      </div>

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
    </div>
  );
}

function StageColumn({
  roomy,
  zoneProps,
  over,
  placeholder,
  title,
  count,
  accentClass,
  badgeVariant,
  icon,
  children,
}: {
  roomy: boolean;
  zoneProps: { 'data-drop-zone': string };
  over: boolean;
  placeholder: React.ReactNode;
  title: string;
  count: number | undefined;
  accentClass: string;
  badgeVariant: BadgeVariant;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div {...zoneProps} className={cn('card-aura flex max-h-(--app-queue-col-max) min-h-0 flex-col overflow-hidden rounded-xl border bg-card/75 shadow-xs backdrop-blur-xs transition-shadow sm:rounded-2xl lg:h-full lg:max-h-none', over && 'ring-2 ring-primary/40', roomy && 'h-[min(78dvh,38rem)] max-h-none sm:h-auto sm:max-h-(--app-queue-col-max)')}>
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/25 p-2.5 sm:p-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('size-2 rounded-full ring-2 ring-background', accentClass)} />
          <span className="text-muted-foreground">{icon}</span>
          <h3 className="text-xs font-bold tracking-tight text-foreground">{title}</h3>
        </div>
        <Badge variant={badgeVariant} className="font-bold">
          {count === undefined ? <Skeleton className="h-4 w-4" /> : count}
        </Badge>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-3 touch-pan-y">
        <div className="flex flex-col gap-2.5">{children}{placeholder}</div>
      </div>
    </div>
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
} & Pick<React.ComponentProps<'div'>, 'onPointerDown' | 'onClickCapture'>) {
  const { t, lang } = useLanguage();
  const accent = STATUS_COLORS[appt.status];
  const docLabel = doctorDisplayName(appt.doctor, lang);

  return (
    <div
      {...dragProps}
      onClick={onClick}
      data-queue-card=""
      className={cn('group relative flex flex-col rounded-xl border-2 bg-card p-3 shadow-xs transition-[color,opacity] duration-200 hover:shadow-md cursor-pointer sm:p-3.5', dragging && 'opacity-40')}
      style={{ borderColor: accent }}
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
