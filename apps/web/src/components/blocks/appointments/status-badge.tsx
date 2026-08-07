'use client';

import { cn } from '@/lib/utils';
import { AppointmentStatus } from '@/services/appointments.service';

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  unconfirmed: '#f59e0b',
  confirmed: '#22c55e',
  checked_in: '#14b8a6',
  waiting: '#eab308',
  in_progress: '#3b82f6',
  completed: '#6366f1',
  no_show: '#ef4444',
  cancelled: '#9ca3af',
};

export const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; short: string; className: string; dotClassName: string }
> = {
  unconfirmed: {
    label: 'Unconfirmed',
    short: 'Pending',
    className: 'bg-warning/15 text-warning border-warning/25',
    dotClassName: 'bg-warning',
  },
  confirmed: {
    label: 'Confirmed',
    short: 'Confirmed',
    className: 'bg-success/15 text-success border-success/25',
    dotClassName: 'bg-success',
  },
  checked_in: {
    label: 'Checked In',
    short: 'Checked in',
    className: 'bg-success/15 text-success border-success/25',
    dotClassName: 'bg-success',
  },
  waiting: {
    label: 'Waiting',
    short: 'Waiting',
    className: 'bg-warning/15 text-warning border-warning/25',
    dotClassName: 'bg-warning',
  },
  in_progress: {
    label: 'In Progress',
    short: 'In progress',
    className: 'bg-primary/15 text-primary border-primary/25',
    dotClassName: 'bg-primary animate-pulse',
  },
  completed: {
    label: 'Completed',
    short: 'Done',
    className: 'bg-primary/15 text-primary border-primary/25',
    dotClassName: 'bg-primary',
  },
  no_show: {
    label: 'No Show',
    short: 'No-show',
    className: 'bg-error/15 text-error border-error/25',
    dotClassName: 'bg-error',
  },
  cancelled: {
    label: 'Cancelled',
    short: 'Cancelled',
    className: 'bg-muted text-muted-foreground border-border',
    dotClassName: 'bg-muted-foreground',
  },
};

export const STATUS_OPTIONS: AppointmentStatus[] = [
  'unconfirmed',
  'confirmed',
  'checked_in',
  'waiting',
  'in_progress',
  'completed',
  'no_show',
  'cancelled',
];

export const SCHEDULE_FILTER_STATUSES: AppointmentStatus[] = [
  'unconfirmed',
  'confirmed',
  'in_progress',
  'completed',
  'no_show',
  'cancelled',
];

interface Props {
  status: AppointmentStatus;
  className?: string;
  compact?: boolean;
}

export function StatusBadgeBlock({ status, className, compact }: Props) {
  const config = STATUS_CONFIG[status];
  const text = compact ? config.short : config.label;

  return (
    <span
      title={config.label}
      aria-label={config.label}
      className={cn(
        'inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none tracking-tight',
        config.className,
        className,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', config.dotClassName)} />
      <span className="truncate">{text}</span>
    </span>
  );
}
