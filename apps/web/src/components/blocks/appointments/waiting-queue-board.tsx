'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { useNow } from '@/hooks/shared/use-now';
import {
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { Appointment, AppointmentStatus } from '@/services/appointments.service';
import { useUpdateAppointment, useMarkAppointmentPaid } from '@/hooks/api/use-appointments';
import { AppointmentStatusSelect } from './appointment-status-select';
import { formatApptTimeRange, patientDisplayName } from './appointment-display';
import { STATUS_COLORS } from './status-badge';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CardGridSkeleton, SoftTip } from '@/components/primitives';
import { ViewFocusToggle } from './view-focus';
import { elapsedMinutesSince, formatWaitingMins } from '@/lib/waiting-time';
import { IconActivate, IconCalendarClock, IconCheckCircle, IconCreditCard, IconDeactivate, IconMore, IconOnline, IconPatients, IconPlay, IconRoom, IconRotateCcw, IconService, IconTime, IconTimer, IconView } from '@/constants/icons';

type StageTab = 'all' | 'waiting' | 'in_progress' | 'upcoming' | 'completed';
type Tone = 'default' | 'warning' | 'info' | 'muted' | 'success';

interface Props {
  appointments: Appointment[] | undefined;
  isLoading: boolean;
  focused?: boolean;
  onEventClick: (appointment: Appointment) => void;
}

export function WaitingQueueBoard({
  appointments,
  isLoading,
  focused = false,
  onEventClick,
}: Props) {
  const [stageTab, setStageTab] = useState<StageTab>('all');
  const now = useNow(10_000);
  const updateMutation = useUpdateAppointment();
  const markPaidMutation = useMarkAppointmentPaid();

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
        .filter((a) => a.status === 'waiting' || a.status === 'checked_in')
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
        .filter((a) => a.status === 'in_progress')
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
        .filter((a) => a.status === 'confirmed' || a.status === 'unconfirmed')
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [dayAppointments],
  );

  const completedList = useMemo(
    () =>
      dayAppointments
        .filter((a) => a.status === 'completed' || a.status === 'no_show' || a.status === 'cancelled')
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
    [dayAppointments],
  );

  const handleQuickStatus = useCallback(
    (appt: Appointment, targetStatus: AppointmentStatus) => {
      updateMutation.mutate(
        { id: appt.id, data: { status: targetStatus } },
        {
          onSuccess: () => {
            const name = patientDisplayName(appt);
            const msgs: Partial<Record<AppointmentStatus, string>> = {
              in_progress: `Started consultation with ${name}`,
              completed: `Visit completed for ${name}`,
              waiting: `${name} returned to waiting room`,
              checked_in: `${name} checked in`,
              no_show: `${name} marked as no-show`,
            };
            toast.success(msgs[targetStatus] || 'Status updated');
          },
          onError: (err) => {
            toast.error(extractErrorMessage(err) || 'Failed to update status');
          },
        },
      );
    },
    [updateMutation],
  );

  const isVisible = useCallback(
    (stage: StageTab) => stageTab === 'all' || stageTab === stage,
    [stageTab],
  );

  if (isLoading && (!appointments || appointments.length === 0)) {
    return <CardGridSkeleton count={4} columns="grid-cols-1 lg:grid-cols-4" />;
  }

  const stageTabs: {
    key: StageTab;
    label: string;
    short: string;
    icon: React.ReactNode;
    variant: Tone;
  }[] = [
    { key: 'all', label: 'All', short: 'All', icon: null, variant: 'default' },
    {
      key: 'waiting',
      label: `Waiting (${waitingList.length})`,
      short: `Wait (${waitingList.length})`,
      icon: <IconTimer className="size-3" />,
      variant: 'warning',
    },
    {
      key: 'in_progress',
      label: `Consulting (${inProgressList.length})`,
      short: `Live (${inProgressList.length})`,
      icon: <IconService className="size-3" />,
      variant: 'info',
    },
    {
      key: 'upcoming',
      label: `Upcoming (${upcomingList.length})`,
      short: `Next (${upcomingList.length})`,
      icon: <IconPatients className="size-3" />,
      variant: 'muted',
    },
    {
      key: 'completed',
      label: `Done (${completedList.length})`,
      short: `Done (${completedList.length})`,
      icon: <IconCheckCircle className="size-3" />,
      variant: 'success',
    },
  ];

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden border bg-card shadow-xs',
        focused
          ? 'h-full min-h-0 rounded-none border-0'
          : 'card-aura min-h-0 flex-1 rounded-xl sm:rounded-2xl',
      )}
    >
      <div className="flex items-center justify-between gap-1.5 border-b bg-muted/20 px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none sm:gap-1.5">
          {stageTabs.map(({ key, label, short, icon, variant }) => (
            <SoftTip key={key} label={label}>
              <Badge
                asChild
                variant={stageTab === key ? variant : 'secondary'}
              >
                <button
                  type="button"
                  onClick={() => setStageTab(key)}
                  className="cursor-pointer py-1.5 shadow-2xs active:scale-95"
                >
                  {icon}
                  <span className="sm:hidden">{short}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              </Badge>
            </SoftTip>
          ))}
        </div>
        <ViewFocusToggle />
      </div>

      <div
        className={cn(
          'grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-y-auto overscroll-y-contain p-2.5',
          'sm:gap-3 sm:p-3 md:gap-4 md:p-4',
          stageTab === 'all' ? 'lg:grid-cols-4' : 'lg:grid-cols-1',
          'lg:grid-rows-[minmax(0,1fr)] lg:items-stretch lg:overflow-hidden',
        )}
      >
        {isVisible('waiting') && (
          <StageColumn
            title="Waiting Room"
            count={waitingList.length}
            accentClass="bg-warning"
            badgeVariant="warning"
            icon={<IconTimer className="size-4 text-warning" />}
          >
            {waitingList.length === 0 ? (
              <EmptyStageMessage icon={<IconTimer className="size-6 text-warning/40" />} text="No patients waiting right now" />
            ) : (
              waitingList.map((appt) => {
                const waitMins = elapsedMinutesSince(
                  appt.waitingStartedAt || appt.statusUpdatedAt || appt.scheduledAt,
                  now,
                );
                const timerVariant =
                  waitMins >= 25 ? 'destructive' : waitMins >= 12 ? 'warning' : 'success';
                const waitLabel = waitMins >= 25 ? 'Long Wait' : waitMins >= 12 ? 'Moderate' : 'On Track';

                return (
                  <QueueCard key={appt.id} appointment={appt} onClick={() => onEventClick(appt)}>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={timerVariant} className={cn('font-semibold', waitMins >= 25 && 'animate-pulse')}>
                        <IconTime className="size-3" />
                        {formatWaitingMins(waitMins, true)} · {waitLabel}
                      </Badge>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <AppointmentStatusSelect appointment={appt} compact />
                        <QuickActionMenu
                          onView={() => onEventClick(appt)}
                          actions={[
                            {
                              label: 'Start Consultation',
                              icon: <IconPlay className="size-3.5" />,
                              onClick: () => handleQuickStatus(appt, 'in_progress'),
                            },
                            {
                              label: 'Mark No-Show',
                              icon: <IconDeactivate className="size-3.5" />,
                              className: 'text-warning',
                              onClick: () => handleQuickStatus(appt, 'no_show'),
                            },
                          ]}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        className="w-full text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
                        disabled={updateMutation.isPending}
                        onClick={(e) => { e.stopPropagation(); handleQuickStatus(appt, 'in_progress'); }}
                      >
                        <IconPlay className="mr-1.5 size-3.5 fill-current" />
                        Start Consultation
                      </Button>
                    </div>
                  </QueueCard>
                );
              })
            )}
          </StageColumn>
        )}

        {isVisible('in_progress') && (
          <StageColumn
            title="In Consultation"
            count={inProgressList.length}
            accentClass="bg-primary"
            badgeVariant="info"
            icon={<IconService className="size-4 text-primary" />}
          >
            {inProgressList.length === 0 ? (
              <EmptyStageMessage icon={<IconService className="size-6 text-primary/40" />} text="No consultations currently in session" />
            ) : (
              inProgressList.map((appt) => {
                const sessionMins = elapsedMinutesSince(
                  appt.inProgressAt || appt.statusUpdatedAt || appt.scheduledAt,
                  now,
                );
                const isLong = sessionMins > appt.durationMins;

                return (
                  <QueueCard key={appt.id} appointment={appt} onClick={() => onEventClick(appt)}>
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={isLong ? 'destructive' : 'info'}
                        className={cn('font-semibold', isLong && 'animate-pulse')}
                      >
                        <IconTimer className="size-3 animate-spin" />
                        {formatWaitingMins(sessionMins, true)} / {appt.durationMins}m
                      </Badge>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <AppointmentStatusSelect appointment={appt} compact />
                        <QuickActionMenu
                          onView={() => onEventClick(appt)}
                          actions={[
                            {
                              label: 'Finish Consultation',
                              icon: <IconCheckCircle className="size-3.5" />,
                              onClick: () => handleQuickStatus(appt, 'completed'),
                            },
                            {
                              label: 'Return to Waiting',
                              icon: <IconRotateCcw className="size-3.5" />,
                              onClick: () => handleQuickStatus(appt, 'waiting'),
                            },
                          ]}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        className="w-full text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
                        disabled={updateMutation.isPending}
                        onClick={(e) => { e.stopPropagation(); handleQuickStatus(appt, 'completed'); }}
                      >
                        <IconCheckCircle className="mr-1.5 size-3.5" />
                        Finish Consultation
                      </Button>
                    </div>
                  </QueueCard>
                );
              })
            )}
          </StageColumn>
        )}

        {isVisible('upcoming') && (
          <StageColumn
            title="Upcoming Today"
            count={upcomingList.length}
            accentClass="bg-muted-foreground"
            badgeVariant="muted"
            icon={<IconCalendarClock className="size-4 text-muted-foreground" />}
          >
            {upcomingList.length === 0 ? (
              <EmptyStageMessage icon={<IconCalendarClock className="size-6 text-muted-foreground/40" />} text="No upcoming visits left today" />
            ) : (
              upcomingList.map((appt) => (
                <QueueCard key={appt.id} appointment={appt} onClick={() => onEventClick(appt)}>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="muted" className="font-semibold">
                      <IconTime className="size-3" />
                      {formatApptTimeRange(appt)}
                    </Badge>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <AppointmentStatusSelect appointment={appt} compact />
                      <QuickActionMenu
                        onView={() => onEventClick(appt)}
                        actions={[
                          {
                            label: 'Patient Arrived',
                            icon: <IconActivate className="size-3.5" />,
                            onClick: () => handleQuickStatus(appt, 'waiting'),
                          },
                          {
                            label: 'Start Directly',
                            icon: <IconPlay className="size-3.5" />,
                            onClick: () => handleQuickStatus(appt, 'in_progress'),
                          },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs font-semibold hover:bg-primary/10 hover:text-primary active:scale-[0.98] transition-all"
                      disabled={updateMutation.isPending}
                      onClick={(e) => { e.stopPropagation(); handleQuickStatus(appt, 'waiting'); }}
                    >
                      <IconActivate className="mr-1.5 size-3.5 text-primary" />
                      Patient Arrived
                    </Button>
                  </div>
                </QueueCard>
              ))
            )}
          </StageColumn>
        )}

        {isVisible('completed') && (
          <StageColumn
            title="Done / Closed"
            count={completedList.length}
            accentClass="bg-success"
            badgeVariant="success"
            icon={<IconCheckCircle className="size-4 text-success" />}
          >
            {completedList.length === 0 ? (
              <EmptyStageMessage icon={<IconCheckCircle className="size-6 text-success/40" />} text="No completed visits yet today" />
            ) : (
              completedList.map((appt) => (
                <QueueCard key={appt.id} appointment={appt} onClick={() => onEventClick(appt)}>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="success" className="font-semibold">
                      <IconCheckCircle className="size-3" />
                      Visit Completed
                    </Badge>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <AppointmentStatusSelect appointment={appt} compact />
                      <QuickActionMenu onView={() => onEventClick(appt)} actions={[]} />
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t pt-2 text-[11px]">
                    <span className="text-muted-foreground font-medium">Billing:</span>
                    {appt.isPaid ? (
                      <Badge variant="success">
                        <IconCreditCard className="size-3" />
                        Paid
                      </Badge>
                    ) : (
                      <Badge asChild variant="warning">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!appt.paymentMethodId) {
                              toast.info('Open appointment details to select a payment method first');
                              onEventClick(appt);
                              return;
                            }
                            markPaidMutation.mutate(
                              { id: appt.id, paymentMethodId: appt.paymentMethodId },
                              {
                                onSuccess: () => toast.success('Marked as paid'),
                                onError: (err) => toast.error(extractErrorMessage(err) || 'Failed to mark as paid'),
                              },
                            );
                          }}
                          className="cursor-pointer"
                        >
                          <IconCreditCard className="size-3" />
                          Unpaid · Mark Paid
                        </button>
                      </Badge>
                    )}
                  </div>
                </QueueCard>
              ))
            )}
          </StageColumn>
        )}
      </div>
    </div>
  );
}

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}

function QuickActionMenu({
  onView,
  actions,
}: {
  onView: () => void;
  actions: QuickAction[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer active:scale-95"
        >
          <IconMore className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 text-xs">
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs"
          onClick={onView}
        >
          <IconView className="size-3.5 shrink-0 text-muted-foreground" />
          Open Details
        </DropdownMenuItem>

        {actions.length > 0 && <DropdownMenuSeparator />}

        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            className={cn('flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs', action.className)}
            onClick={action.onClick}
          >
            <span className="shrink-0 text-muted-foreground">{action.icon}</span>
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StageColumn({
  title,
  count,
  accentClass,
  badgeVariant,
  icon,
  children,
}: {
  title: string;
  count: number;
  accentClass: string;
  badgeVariant: Tone;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card-aura flex max-h-(--app-queue-col-max) min-h-0 flex-col overflow-hidden rounded-xl border bg-card/75 shadow-xs backdrop-blur-xs sm:rounded-2xl lg:h-full lg:max-h-none">
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/25 p-2.5 sm:p-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('size-2 rounded-full ring-2 ring-background', accentClass)} />
          <span className="text-muted-foreground">{icon}</span>
          <h3 className="text-xs font-bold tracking-tight text-foreground">{title}</h3>
        </div>
        <Badge variant={badgeVariant} className="font-bold">
          {count}
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
  onClick: () => void;
  children: React.ReactNode;
}) {
  const accent = STATUS_COLORS[appt.status];
  const docInitials = appt.doctor?.name?.substring(0, 2).toUpperCase() || 'DR';

  return (
    <div
      onClick={onClick}
      className="card-aura group relative flex flex-col rounded-xl border bg-card p-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50 hover:ring-1 hover:ring-primary/25 active:scale-[0.985] cursor-pointer sm:p-3.5"
      style={{ borderLeftWidth: '4px', borderLeftColor: accent }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
            {patientDisplayName(appt)}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground font-medium flex items-center gap-1">
            <IconTime className="size-2.5" />
            {formatApptTimeRange(appt)}
          </p>
        </div>
        <div className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground ring-2 ring-background">
          {docInitials}
        </div>
      </div>

      <div className="mb-2.5 flex flex-col gap-1 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5 truncate">
          <IconService className="size-3 shrink-0 text-primary" />
          <span className="truncate font-medium text-foreground/90">
            {appt.doctor?.name} · {appt.service?.name || 'General Visit'}
          </span>
        </div>
        {appt.sessionType === 'online' ? (
          <div className="flex items-center gap-1.5 text-primary font-medium">
            <IconOnline className="size-3 shrink-0" />
            <span>Online session</span>
          </div>
        ) : (
          appt.room && (
            <div className="flex items-center gap-1.5">
              <IconRoom className="size-3 shrink-0" />
              <span>Room: {appt.room.name}</span>
            </div>
          )
        )}
      </div>

      {children}
    </div>
  );
}

function EmptyStageMessage({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground bg-muted/10">
      <div className="mb-2 opacity-60">{icon}</div>
      <p className="font-medium">{text}</p>
    </div>
  );
}
