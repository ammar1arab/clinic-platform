'use client';

import { useMemo, useCallback } from 'react';
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
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Appointment, AppointmentStatus } from '@/services/appointments.service';
import { useUpdateAppointment, useMarkAppointmentPaid } from '@/hooks/use-appointments';
import { AppointmentStatusSelect } from './appointment-status-select';
import { formatApptTimeRange, patientDisplayName } from './calendar-time';
import { STATUS_COLORS } from './status-colors';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { StatGridSkeleton, CardGridSkeleton } from '@/components/primitives/skeleton-presets';

interface Props {
  appointments: Appointment[] | undefined;
  isLoading: boolean;
  onEventClick: (appointment: Appointment) => void;
}

function calculateElapsedMinutes(dateString: string | null | undefined, now: Date): number {
  if (!dateString) return 0;
  const start = new Date(dateString).getTime();
  const current = now.getTime();
  return Math.max(0, Math.floor((current - start) / 60000));
}

function formatElapsed(minutes: number): string {
  if (minutes < 1) return '< 1m';
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `${hrs}h ${rem}m`;
}

export function WaitingQueueBoard({ appointments, isLoading, onEventClick }: Props) {
  const now = useNow(10_000);
  const updateMutation = useUpdateAppointment();
  const markPaidMutation = useMarkAppointmentPaid();

  const todayAppointments = useMemo(() => {
    if (!appointments) return [];
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();

    return appointments.filter((appt) => {
      const t = new Date(appt.scheduledAt).getTime();
      return t >= startOfDay && t <= endOfDay;
    });
  }, [appointments]);

  const { waitingList, inProgressList, upcomingList, completedList } = useMemo(() => {
    const waiting: Appointment[] = [];
    const inProgress: Appointment[] = [];
    const upcoming: Appointment[] = [];
    const completed: Appointment[] = [];

    for (const appt of todayAppointments) {
      if (appt.status === 'waiting' || appt.status === 'checked_in') {
        waiting.push(appt);
      } else if (appt.status === 'in_progress') {
        inProgress.push(appt);
      } else if (appt.status === 'completed') {
        completed.push(appt);
      } else if (appt.status === 'confirmed' || appt.status === 'unconfirmed') {
        upcoming.push(appt);
      }
    }

    waiting.sort((a, b) => {
      const aStart = new Date(a.waitingStartedAt || a.statusUpdatedAt || a.scheduledAt).getTime();
      const bStart = new Date(b.waitingStartedAt || b.statusUpdatedAt || b.scheduledAt).getTime();
      return aStart - bStart;
    });

    return {
      waitingList: waiting,
      inProgressList: inProgress,
      upcomingList: upcoming,
      completedList: completed,
    };
  }, [todayAppointments]);

  const handleQuickStatus = useCallback((appt: Appointment, targetStatus: AppointmentStatus) => {
    updateMutation.mutate(
      {
        id: appt.id,
        data: { status: targetStatus },
      },
      {
        onSuccess: () => {
          if (targetStatus === 'in_progress') {
            toast.success(`Started consultation with ${patientDisplayName(appt)}`);
          } else if (targetStatus === 'completed') {
            toast.success(`Visit completed for ${patientDisplayName(appt)}`);
          } else if (targetStatus === 'checked_in' || targetStatus === 'waiting') {
            toast.success(`${patientDisplayName(appt)} checked into waiting room`);
          } else if (targetStatus === 'no_show') {
            toast.warning(`Marked ${patientDisplayName(appt)} as no-show`);
          } else if (targetStatus === 'cancelled') {
            toast.info(`Cancelled visit for ${patientDisplayName(appt)}`);
          }
        },
        onError: (err) => {
          toast.error(extractErrorMessage(err) || 'Failed to update status');
        },
      },
    );
  }, [updateMutation]);

  if (isLoading && (!appointments || appointments.length === 0)) {
    return (
      <div className="space-y-4">
        <StatGridSkeleton count={4} />
        <CardGridSkeleton count={4} columns="grid-cols-1 lg:grid-cols-4" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Timer className="size-4 text-amber-500" />}
          label="In Waiting Room"
          value={waitingList.length}
          colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
        />
        <StatCard
          icon={<Stethoscope className="size-4 text-blue-500" />}
          label="In Consultation"
          value={inProgressList.length}
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
        />
        <StatCard
          icon={<Users className="size-4 text-slate-500" />}
          label="Upcoming Today"
          value={upcomingList.length}
          colorClass="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
        />
        <StatCard
          icon={<CheckCircle2 className="size-4 text-emerald-500" />}
          label="Completed Today"
          value={completedList.length}
          colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <StageColumn
          title="Waiting Room"
          count={waitingList.length}
          accentColor="#f59e0b"
          badgeClassName="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
          icon={<Timer className="size-4 text-amber-500" />}
        >
          {waitingList.length === 0 ? (
            <EmptyStageMessage
              icon={<Timer className="size-6 text-amber-500/40" />}
              text="No patients waiting right now"
            />
          ) : (
            waitingList.map((appt) => {
              const waitMins = calculateElapsedMinutes(
                appt.waitingStartedAt || appt.statusUpdatedAt || appt.scheduledAt,
                now,
              );

              let timerStyle = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
              let waitLabel = 'On Track';
              if (waitMins >= 25) {
                timerStyle = 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 animate-pulse';
                waitLabel = 'Long Wait';
              } else if (waitMins >= 12) {
                timerStyle = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
                waitLabel = 'Moderate';
              }

              return (
                <QueueCard
                  key={appt.id}
                  appointment={appt}
                  onClick={() => onEventClick(appt)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-transform hover:scale-105 shadow-2xs',
                        timerStyle,
                      )}
                    >
                      <Clock className="size-3" />
                      {formatElapsed(waitMins)} ({waitLabel})
                    </span>

                    <div className="flex items-center gap-1">
                      <AppointmentStatusSelect appointment={appt} compact />
                      <CardMenu
                        onAction={(action) => {
                          if (action === 'in_progress') handleQuickStatus(appt, 'in_progress');
                          else if (action === 'no_show') handleQuickStatus(appt, 'no_show');
                          else if (action === 'cancel') handleQuickStatus(appt, 'cancelled');
                          else if (action === 'view') onEventClick(appt);
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="w-full bg-emerald-600 font-bold text-xs text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] transition-all"
                      disabled={updateMutation.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickStatus(appt, 'in_progress');
                      }}
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

        <StageColumn
          title="In Consultation"
          count={inProgressList.length}
          accentColor="#3b82f6"
          badgeClassName="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
          icon={<Stethoscope className="size-4 text-blue-500" />}
        >
          {inProgressList.length === 0 ? (
            <EmptyStageMessage
              icon={<Stethoscope className="size-6 text-blue-500/40" />}
              text="No consultations currently in session"
            />
          ) : (
            inProgressList.map((appt) => {
              const sessionMins = calculateElapsedMinutes(
                appt.inProgressAt || appt.statusUpdatedAt || appt.scheduledAt,
                now,
              );

              return (
                <QueueCard
                  key={appt.id}
                  appointment={appt}
                  onClick={() => onEventClick(appt)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 shadow-2xs">
                      <Timer className="size-3 animate-spin" />
                      Session: {formatElapsed(sessionMins)} / {appt.durationMins}m
                    </span>

                    <div className="flex items-center gap-1">
                      <AppointmentStatusSelect appointment={appt} compact />
                      <CardMenu
                        onAction={(action) => {
                          if (action === 'complete') handleQuickStatus(appt, 'completed');
                          else if (action === 'return_waiting') handleQuickStatus(appt, 'waiting');
                          else if (action === 'view') onEventClick(appt);
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="w-full bg-blue-600 font-bold text-xs text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all"
                      disabled={updateMutation.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickStatus(appt, 'completed');
                      }}
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

        <StageColumn
          title="Upcoming Today"
          count={upcomingList.length}
          accentColor="#64748b"
          badgeClassName="bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30"
          icon={<CalendarClock className="size-4 text-slate-500" />}
        >
          {upcomingList.length === 0 ? (
            <EmptyStageMessage
              icon={<CalendarClock className="size-6 text-slate-500/40" />}
              text="No upcoming visits left today"
            />
          ) : (
            upcomingList.map((appt) => (
              <QueueCard
                key={appt.id}
                appointment={appt}
                onClick={() => onEventClick(appt)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                    <Clock className="size-3" />
                    {formatApptTimeRange(appt)}
                  </span>

                  <div className="flex items-center gap-1">
                    <AppointmentStatusSelect appointment={appt} compact />
                    <CardMenu
                      onAction={(action) => {
                        if (action === 'check_in') handleQuickStatus(appt, 'waiting');
                        else if (action === 'start') handleQuickStatus(appt, 'in_progress');
                        else if (action === 'cancel') handleQuickStatus(appt, 'cancelled');
                        else if (action === 'view') onEventClick(appt);
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-semibold hover:bg-primary/10 hover:text-primary active:scale-[0.98] transition-all"
                    disabled={updateMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickStatus(appt, 'waiting');
                    }}
                  >
                    <UserCheck className="mr-1.5 size-3.5 text-primary" />
                    Patient Arrived
                  </Button>
                </div>
              </QueueCard>
            ))
          )}
        </StageColumn>

        <StageColumn
          title="Completed"
          count={completedList.length}
          accentColor="#10b981"
          badgeClassName="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
          icon={<CheckCircle2 className="size-4 text-emerald-500" />}
        >
          {completedList.length === 0 ? (
            <EmptyStageMessage
              icon={<CheckCircle2 className="size-6 text-emerald-500/40" />}
              text="No completed visits yet today"
            />
          ) : (
            completedList.map((appt) => {
              const isPaid = appt.isPaid;

              return (
                <QueueCard
                  key={appt.id}
                  appointment={appt}
                  onClick={() => onEventClick(appt)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3" /> Visit Completed
                    </span>

                    <div className="flex items-center gap-1">
                      <AppointmentStatusSelect appointment={appt} compact />
                      <CardMenu
                        onAction={(action) => {
                          if (action === 'view') onEventClick(appt);
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t pt-2 text-[11px]">
                    <span className="text-muted-foreground font-medium">Billing:</span>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                        <CreditCard className="size-3" /> Paid
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markPaidMutation.mutate({
                            id: appt.id,
                            paymentMethodId: appt.paymentMethodId || '',
                          });
                        }}
                        className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        <CreditCard className="size-3" /> Unpaid (Mark Paid)
                      </button>
                    )}
                  </div>
                </QueueCard>
              );
            })
          )}
        </StageColumn>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-xs transition-all duration-150 hover:shadow-sm">
      <div className={cn('grid size-9 shrink-0 place-items-center rounded-lg border', colorClass)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="text-lg font-bold tracking-tight text-foreground">{value}</p>
      </div>
    </div>
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
  return (
    <div className="flex flex-col rounded-xl border bg-card/60 shadow-xs backdrop-blur-xs">
      <div className="flex items-center justify-between border-b p-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <span
            className="size-2 rounded-full ring-2 ring-background"
            style={{ backgroundColor: accentColor }}
          />
          <span className="text-muted-foreground">{icon}</span>
          <h3 className="text-xs font-bold text-foreground tracking-tight">{title}</h3>
        </div>
        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-2xs', badgeClassName)}>
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-2.5 p-3 min-h-[380px] max-h-[72vh] overflow-y-auto overscroll-contain">
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
      className="group relative flex flex-col rounded-xl border bg-card p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/50 active:scale-[0.99] cursor-pointer"
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: accent,
      }}
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
        <div className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
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

function CardMenu({
  onAction,
}: {
  onAction: (action: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 text-xs">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction('view'); }}>
          <Eye className="mr-2 size-3.5" /> Open details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction('in_progress'); }}>
          <Play className="mr-2 size-3.5" /> Start visit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction('complete'); }}>
          <CheckCircle2 className="mr-2 size-3.5" /> Complete visit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction('return_waiting'); }}>
          <RotateCcw className="mr-2 size-3.5" /> Return to waiting
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction('no_show'); }} className="text-amber-600">
          <UserX className="mr-2 size-3.5" /> Mark No-Show
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction('cancel'); }} className="text-rose-600">
          <XCircle className="mr-2 size-3.5" /> Cancel visit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyStageMessage({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground bg-muted/10">
      <div className="mb-2">{icon}</div>
      <p className="font-medium">{text}</p>
    </div>
  );
}
