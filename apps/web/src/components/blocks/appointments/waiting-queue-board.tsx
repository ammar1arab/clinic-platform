'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { useNow } from '@/hooks/use-now';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  DoorOpen,
  Eye,
  MoreHorizontal,
  Play,
  RotateCcw,
  Stethoscope,
  Timer,
  UserCheck,
  UserX,
  Users,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Appointment, AppointmentStatus } from '@/services/appointments.service';
import { useUpdateAppointment, useMarkAppointmentPaid } from '@/hooks/use-appointments';
import { AppointmentStatusSelect } from './appointment-status-select';
import { formatApptTimeRange, patientDisplayName } from './appointment-display';
import { STATUS_COLORS } from './status-badge';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CardGridSkeleton } from '@/components/primitives/skeleton-presets';
import { useViewFocused, ViewFocusToggle } from './view-focus';
import { elapsedMinutesSince, formatElapsedMins } from '@/lib/waiting-time';

type StageTab = 'all' | 'waiting' | 'in_progress' | 'upcoming' | 'completed';

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

  const stageTabs = [
    { key: 'all' as const, label: 'All', short: 'All', icon: null, cls: 'bg-primary text-primary-foreground' },
    {
      key: 'waiting' as const,
      label: `Waiting (${waitingList.length})`,
      short: `Wait (${waitingList.length})`,
      icon: <Timer className="size-3" />,
      cls: 'bg-amber-600 text-white',
    },
    {
      key: 'in_progress' as const,
      label: `Consulting (${inProgressList.length})`,
      short: `Live (${inProgressList.length})`,
      icon: <Stethoscope className="size-3" />,
      cls: 'bg-blue-600 text-white',
    },
    {
      key: 'upcoming' as const,
      label: `Upcoming (${upcomingList.length})`,
      short: `Next (${upcomingList.length})`,
      icon: <Users className="size-3" />,
      cls: 'bg-slate-700 text-white dark:bg-slate-600',
    },
    {
      key: 'completed' as const,
      label: `Done (${completedList.length})`,
      short: `Done (${completedList.length})`,
      icon: <CheckCircle2 className="size-3" />,
      cls: 'bg-emerald-600 text-white',
    },
  ];

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden border bg-card shadow-xs',
        focused
          ? 'h-full min-h-0 rounded-none border-0'
          : 'card-aura rounded-xl sm:rounded-2xl',
      )}
    >
      <div className="flex items-center justify-between gap-1.5 border-b bg-muted/20 px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none sm:gap-1.5">
          {stageTabs.map(({ key, label, short, icon, cls }) => (
            <button
              key={key}
              type="button"
              title={label}
              onClick={() => setStageTab(key)}
              className={cn(
                'inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold shadow-2xs transition-all duration-150 active:scale-95 sm:gap-1.5 sm:px-2.5 sm:text-xs',
                stageTab === key
                  ? cls
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {icon}
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        <ViewFocusToggle />
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-2.5 p-2.5 sm:gap-3 sm:p-3 md:gap-4 md:p-4',
          stageTab === 'all' ? 'lg:grid-cols-4' : 'lg:grid-cols-1',
          focused &&
            'min-h-0 flex-1 overflow-y-auto overscroll-contain max-lg:content-start lg:grid-rows-1 lg:items-stretch lg:overflow-hidden',
        )}
      >
        {isVisible('waiting') && (
          <StageColumn
            title="Waiting Room"
            count={waitingList.length}
            accentColor="#f59e0b"
            badgeClassName="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
            icon={<Timer className="size-4 text-amber-500" />}
          >
            {waitingList.length === 0 ? (
              <EmptyStageMessage icon={<Timer className="size-6 text-amber-500/40" />} text="No patients waiting right now" />
            ) : (
              waitingList.map((appt) => {
                const waitMins = elapsedMinutesSince(
                  appt.waitingStartedAt || appt.statusUpdatedAt || appt.scheduledAt,
                  now,
                );
                const timerStyle =
                  waitMins >= 25
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 animate-pulse'
                    : waitMins >= 12
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
                const waitLabel = waitMins >= 25 ? 'Long Wait' : waitMins >= 12 ? 'Moderate' : 'On Track';

                return (
                  <QueueCard key={appt.id} appointment={appt} onClick={() => onEventClick(appt)}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shadow-2xs', timerStyle)}>
                        <Clock className="size-3" />
                        {formatElapsedMins(waitMins)} · {waitLabel}
                      </span>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <AppointmentStatusSelect appointment={appt} compact />
                        <QuickActionMenu
                          onView={() => onEventClick(appt)}
                          actions={[
                            {
                              label: 'Start Consultation',
                              icon: <Play className="size-3.5" />,
                              onClick: () => handleQuickStatus(appt, 'in_progress'),
                            },
                            {
                              label: 'Mark No-Show',
                              icon: <UserX className="size-3.5" />,
                              className: 'text-amber-600',
                              onClick: () => handleQuickStatus(appt, 'no_show'),
                            },
                          ]}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 font-bold text-xs text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] transition-all"
                        disabled={updateMutation.isPending}
                        onClick={(e) => { e.stopPropagation(); handleQuickStatus(appt, 'in_progress'); }}
                      >
                        <Play className="mr-1.5 size-3.5 fill-current" />
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
            accentColor="#3b82f6"
            badgeClassName="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
            icon={<Stethoscope className="size-4 text-blue-500" />}
          >
            {inProgressList.length === 0 ? (
              <EmptyStageMessage icon={<Stethoscope className="size-6 text-blue-500/40" />} text="No consultations currently in session" />
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
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shadow-2xs',
                        isLong
                          ? 'border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300 animate-pulse'
                          : 'border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-300',
                      )}>
                        <Timer className="size-3 animate-spin" />
                        {formatElapsedMins(sessionMins)} / {appt.durationMins}m
                      </span>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <AppointmentStatusSelect appointment={appt} compact />
                        <QuickActionMenu
                          onView={() => onEventClick(appt)}
                          actions={[
                            {
                              label: 'Finish Consultation',
                              icon: <CheckCircle2 className="size-3.5" />,
                              onClick: () => handleQuickStatus(appt, 'completed'),
                            },
                            {
                              label: 'Return to Waiting',
                              icon: <RotateCcw className="size-3.5" />,
                              onClick: () => handleQuickStatus(appt, 'waiting'),
                            },
                          ]}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        className="w-full bg-blue-600 font-bold text-xs text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all"
                        disabled={updateMutation.isPending}
                        onClick={(e) => { e.stopPropagation(); handleQuickStatus(appt, 'completed'); }}
                      >
                        <CheckCircle2 className="mr-1.5 size-3.5" />
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
            accentColor="#64748b"
            badgeClassName="bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30"
            icon={<CalendarClock className="size-4 text-slate-500" />}
          >
            {upcomingList.length === 0 ? (
              <EmptyStageMessage icon={<CalendarClock className="size-6 text-slate-500/40" />} text="No upcoming visits left today" />
            ) : (
              upcomingList.map((appt) => (
                <QueueCard key={appt.id} appointment={appt} onClick={() => onEventClick(appt)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                      <Clock className="size-3" />
                      {formatApptTimeRange(appt)}
                    </span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <AppointmentStatusSelect appointment={appt} compact />
                      <QuickActionMenu
                        onView={() => onEventClick(appt)}
                        actions={[
                          {
                            label: 'Patient Arrived',
                            icon: <UserCheck className="size-3.5" />,
                            onClick: () => handleQuickStatus(appt, 'waiting'),
                          },
                          {
                            label: 'Start Directly',
                            icon: <Play className="size-3.5" />,
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
                      <UserCheck className="mr-1.5 size-3.5 text-primary" />
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
            accentColor="#10b981"
            badgeClassName="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
            icon={<CheckCircle2 className="size-4 text-emerald-500" />}
          >
            {completedList.length === 0 ? (
              <EmptyStageMessage icon={<CheckCircle2 className="size-6 text-emerald-500/40" />} text="No completed visits yet today" />
            ) : (
              completedList.map((appt) => (
                <QueueCard key={appt.id} appointment={appt} onClick={() => onEventClick(appt)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3" /> Visit Completed
                    </span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <AppointmentStatusSelect appointment={appt} compact />
                      <QuickActionMenu onView={() => onEventClick(appt)} actions={[]} />
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t pt-2 text-[11px]">
                    <span className="text-muted-foreground font-medium">Billing:</span>
                    {appt.isPaid ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                        <CreditCard className="size-3" /> Paid
                      </span>
                    ) : (
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
                        className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer transition-colors active:scale-95"
                      >
                        <CreditCard className="size-3" /> Unpaid · Mark Paid
                      </button>
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
          <MoreHorizontal className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 text-xs">
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs"
          onClick={onView}
        >
          <Eye className="size-3.5 shrink-0 text-muted-foreground" />
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
  accentColor,
  badgeClassName,
  icon,
  children,
}: {
  title: string;
  count: number;
  accentColor: string;
  badgeClassName: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const focused = useViewFocused();

  return (
    <div
      className={cn(
        'card-aura flex flex-col overflow-hidden rounded-xl border bg-card/75 shadow-xs backdrop-blur-xs sm:rounded-2xl',
        focused && 'min-h-0 lg:h-full',
      )}
    >
      <div className="flex items-center justify-between border-b bg-muted/25 p-2.5 sm:p-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="size-2 rounded-full ring-2 ring-background"
            style={{ backgroundColor: accentColor }}
          />
          <span className="text-muted-foreground">{icon}</span>
          <h3 className="text-xs font-bold tracking-tight text-foreground">{title}</h3>
        </div>
        <span
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-2xs',
            badgeClassName,
          )}
        >
          {count}
        </span>
      </div>
      <div
        className={cn(
          'flex flex-col gap-2.5 overflow-y-auto overscroll-contain p-3',
          focused ? 'max-lg:max-h-none lg:min-h-0 lg:flex-1' : 'min-h-90 max-h-[72vh]',
        )}
      >
        {children}
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
            <Clock className="size-2.5" />
            {formatApptTimeRange(appt)}
          </p>
        </div>
        <div className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground ring-2 ring-background">
          {docInitials}
        </div>
      </div>

      <div className="mb-2.5 flex flex-col gap-1 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5 truncate">
          <Stethoscope className="size-3 shrink-0 text-primary" />
          <span className="truncate font-medium text-foreground/90">
            {appt.doctor?.name} · {appt.service?.name || 'General Visit'}
          </span>
        </div>
        {appt.sessionType === 'online' ? (
          <div className="flex items-center gap-1.5 text-primary font-medium">
            <Video className="size-3 shrink-0" />
            <span>Online Video Session</span>
          </div>
        ) : (
          appt.room && (
            <div className="flex items-center gap-1.5">
              <DoorOpen className="size-3 shrink-0" />
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
