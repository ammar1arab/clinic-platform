'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNow } from '@/hooks/shared/use-now';
import {
  Button,
  Badge,
  Skeleton,
  type BadgeVariant,
} from '@/components/ui';
import { Appointment } from '@/services/appointments.service';
import { AppointmentStatusSelect } from '../shared/appointment-status-select';
import { doctorDisplayName, formatApptTimeRange, patientDisplayName } from '../shared/appointment-display';
import { STATUS_COLORS } from '../shared/status-badge';
import {
  AppointmentPopover,
  popoverAnchorFromElement,
  type AppointmentPopoverState,
} from './appointment-popovers';
import { cn } from '@/lib/utils';
import { EmptyState, QueueColumnSkeleton, SoftTip } from '@/components/primitives';
import { ViewFocusToggle } from './view-focus';
import { elapsedMinutesSince, formatWaitingMins } from '@/lib/waiting-time';
import { IconActivate, IconCalendarClock, IconCheckCircle, IconCreditCard, IconOnline, IconPatients, IconPlay, IconRoom, IconService, IconTime, IconTimer } from '@/constants/icons';
import { getBilingualName } from '@/i18n';
import { useLanguage } from '@/providers';
import { APPOINTMENT_STATUS, PRESENCE_SOURCE, SESSION_TYPE } from '@clinic/types';
import { QUEUE_STAGE, type QueueStage } from '@/constants/appointment';
import { ROUTES } from '@/constants/routes';
import { visitsService } from '@/services/visits.service';
import { INVALIDATE, useApiMutation } from '@/hooks/query';

interface Props {
  appointments: Appointment[] | undefined;
  isLoading: boolean;
  focused?: boolean;
  canManagePayments?: boolean;
  onEventClick: (appointment: Appointment) => void;
}

export function WaitingQueueBoard({
  appointments,
  isLoading,
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

  const dayAppointments = useMemo(() => {
    if (!appointments) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    return appointments.filter((appt) => {
      const apptDate = new Date(appt.scheduledAt);
      return apptDate >= today && apptDate <= endOfDay;
    });
  }, [appointments]);

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
        .filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED || a.status === APPOINTMENT_STATUS.NO_SHOW || a.status === APPOINTMENT_STATUS.CANCELLED)
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
    [dayAppointments],
  );

  const isVisible = useCallback(
    (stage: QueueStage) => stageTab === QUEUE_STAGE.ALL || stageTab === stage,
    [stageTab],
  );

  const loading = isLoading && !appointments?.length;

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
      label: `${t.queue.waiting} (${waitingList.length})`,
      short: `${t.queue.waiting} (${waitingList.length})`,
      icon: <IconTimer className="size-3" />,
      variant: 'warning',
    },
    {
      key: QUEUE_STAGE.IN_PROGRESS,
      label: `${t.queue.inSession} (${inProgressList.length})`,
      short: `${t.queue.inSession} (${inProgressList.length})`,
      icon: <IconService className="size-3" />,
      variant: 'info',
    },
    {
      key: QUEUE_STAGE.UPCOMING,
      label: `${t.queue.upcomingToday} (${upcomingList.length})`,
      short: `${t.queue.upcomingToday} (${upcomingList.length})`,
      icon: <IconPatients className="size-3" />,
      variant: 'muted',
    },
    {
      key: QUEUE_STAGE.COMPLETED,
      label: `${t.queue.completed} (${completedList.length})`,
      short: `${t.queue.completed} (${completedList.length})`,
      icon: <IconCheckCircle className="size-3" />,
      variant: 'success',
    },
  ];

  return (
    <div
      data-schedule-host=""
      aria-busy={loading || undefined}
      className={cn(
        'relative page-fill overflow-hidden border bg-card shadow-xs',
        focused ? 'rounded-none border-0' : 'card-aura rounded-xl sm:rounded-2xl',
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-1.5 border-b bg-muted/20 px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none sm:gap-1.5">
          {stageTabs.map(({ key, label, short, icon, variant }) => {
            const selected = stageTab === key;
            const showMobileLabel = selected || !icon;
            return (
              <SoftTip key={key} label={label}>
                <Badge
                  asChild
                  variant={selected ? variant : 'secondary'}
                >
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setStageTab(key)}
                    aria-label={loading ? t.common.loading : label}
                    aria-pressed={selected}
                    className={cn(
                      'relative cursor-pointer py-1.5 shadow-2xs active:scale-95',
                      !showMobileLabel && 'gap-0 px-2 sm:gap-1.5 sm:px-2.5',
                    )}
                  >
                    {loading ? <Skeleton className="absolute inset-x-2 inset-y-1.5 rounded-full" /> : null}
                    {icon ? <span aria-hidden={loading} className={cn("inline-flex items-center gap-1.5", loading && "invisible")}>{icon}</span> : null}
                    <span className={cn(showMobileLabel ? 'sm:hidden' : 'hidden', loading && 'invisible')}>
                      {short}
                    </span>
                    <span className={cn("hidden sm:inline", loading && "invisible")}>{label}</span>
                  </button>
                </Badge>
              </SoftTip>
            );
          })}
        </div>
        <ViewFocusToggle />
      </div>

      <div
        className={cn(
          'grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-y-auto overscroll-y-contain p-2.5',
          focused && 'md:h-0',
          'sm:gap-3 sm:p-3 md:gap-4 md:p-4',
          stageTab === QUEUE_STAGE.ALL ? 'lg:grid-cols-4' : 'lg:grid-cols-1',
          'lg:grid-rows-[minmax(0,1fr)] lg:items-stretch lg:overflow-hidden',
        )}
      >
        {isVisible(QUEUE_STAGE.WAITING) && (
          <StageColumn
            roomy={stageTab === QUEUE_STAGE.ALL}
            title={t.queue.waiting}
            count={loading ? undefined : waitingList.length}
            accentClass="bg-warning"
            badgeVariant="warning"
            icon={<IconTimer className="size-4 text-warning" />}
          >
            {loading ? <QueueColumnSkeleton /> : waitingList.length === 0 ? (
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
                  <QueueCard key={appt.id} appointment={appt} onClick={(event) => setAppointmentPopover({ appointment: appt, anchor: popoverAnchorFromElement(event.currentTarget) })}>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={timerVariant} className={cn('font-semibold', waitMins >= 25 && 'animate-pulse')}>
                        <IconTime className="size-3" />
                        {formatWaitingMins(waitMins, t)} · {waitLabel}
                      </Badge>
                      <div onClick={(e) => e.stopPropagation()}>
                        <AppointmentStatusSelect appointment={appt} compact />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        className="w-full text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
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
            title={t.queue.inSession}
            count={loading ? undefined : inProgressList.length}
            accentClass="bg-primary"
            badgeVariant="info"
            icon={<IconService className="size-4 text-primary" />}
          >
            {loading ? <QueueColumnSkeleton /> : inProgressList.length === 0 ? (
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
                  <QueueCard key={appt.id} appointment={appt} onClick={(event) => setAppointmentPopover({ appointment: appt, anchor: popoverAnchorFromElement(event.currentTarget) })}>
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={isLong ? 'destructive' : 'info'}
                        className={cn('font-semibold', isLong && 'animate-pulse')}
                      >
                        <IconTimer className="size-3 animate-spin" />
                        {formatWaitingMins(sessionMins, t)} / {appt.durationMins}{t.appointments.minutesShort}
                      </Badge>
                      <div onClick={(e) => e.stopPropagation()}>
                        <AppointmentStatusSelect appointment={appt} compact />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        className="w-full text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
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
            title={t.queue.upcomingToday}
            count={loading ? undefined : upcomingList.length}
            accentClass="bg-muted-foreground"
            badgeVariant="muted"
            icon={<IconCalendarClock className="size-4 text-muted-foreground" />}
          >
            {loading ? <QueueColumnSkeleton /> : upcomingList.length === 0 ? (
              <EmptyState
                icon={IconCalendarClock}
                title={t.queue.noUpcomingVisitsToday}
                className="min-h-72 px-3 py-8"
              />
            ) : (
              upcomingList.map((appt) => (
                <QueueCard key={appt.id} appointment={appt} onClick={(event) => setAppointmentPopover({ appointment: appt, anchor: popoverAnchorFromElement(event.currentTarget) })}>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="muted" className="font-semibold">
                      <IconTime className="size-3" />
                      {formatApptTimeRange(appt, lang)}
                    </Badge>
                    <div onClick={(e) => e.stopPropagation()}>
                      <AppointmentStatusSelect appointment={appt} compact />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs font-semibold hover:bg-primary/10 hover:text-primary active:scale-[0.98] transition-all"
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
            title={t.queue.completed}
            count={loading ? undefined : completedList.length}
            accentClass="bg-success"
            badgeVariant="success"
            icon={<IconCheckCircle className="size-4 text-success" />}
          >
            {loading ? <QueueColumnSkeleton /> : completedList.length === 0 ? (
              <EmptyState
                icon={IconCheckCircle}
                title={t.queue.noCompletedVisitsToday}
                className="min-h-72 px-3 py-8"
              />
            ) : (
              completedList.map((appt) => (
                <QueueCard key={appt.id} appointment={appt} onClick={(event) => setAppointmentPopover({ appointment: appt, anchor: popoverAnchorFromElement(event.currentTarget) })}>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="success" className="font-semibold">
                      <IconCheckCircle className="size-3" />
                      {t.appointments.markCompleted}
                    </Badge>
                    <div onClick={(e) => e.stopPropagation()}>
                      <AppointmentStatusSelect appointment={appt} compact />
                    </div>
                  </div>

                    {canManagePayments ? (
                      <div className="mt-2.5 flex items-center justify-between border-t pt-2 text-[11px]">
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
  title,
  count,
  accentClass,
  badgeVariant,
  icon,
  children,
}: {
  roomy: boolean;
  title: string;
  count: number | undefined;
  accentClass: string;
  badgeVariant: BadgeVariant;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('card-aura flex max-h-(--app-queue-col-max) min-h-0 flex-col overflow-hidden rounded-xl border bg-card/75 shadow-xs backdrop-blur-xs sm:rounded-2xl lg:h-full lg:max-h-none', roomy && 'h-[min(78dvh,38rem)] max-h-none sm:h-auto sm:max-h-(--app-queue-col-max)')}>
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
        <div className="flex flex-col gap-2.5">{children}</div>
      </div>
    </div>
  );
}

function QueueCard({
  appointment: appt,
  onClick,
  children,
}: {
  appointment: Appointment;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
}) {
  const { t, lang } = useLanguage();
  const accent = STATUS_COLORS[appt.status];
  const docLabel = doctorDisplayName(appt.doctor, lang);
  const docInitials = docLabel.substring(0, 2).toUpperCase() || 'DR';

  return (
    <div
      onClick={onClick}
      data-queue-card=""
      className="group relative flex flex-col rounded-xl border-2 bg-card p-3 shadow-xs transition-colors duration-200 hover:shadow-md cursor-pointer sm:p-3.5"
      style={{ borderColor: accent }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold break-words text-foreground group-hover:text-primary transition-colors">
            {patientDisplayName(appt, lang)}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <IconTime className="size-2.5" />
            {formatApptTimeRange(appt, lang)}
          </p>
        </div>
        <div className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground ring-2 ring-background">
          {docInitials}
        </div>
      </div>

      <div className="mb-2.5 flex flex-col gap-1 text-[10px] text-muted-foreground">
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
