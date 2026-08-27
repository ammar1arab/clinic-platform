import type { AppointmentStatus } from '@/services/appointments.service';

export const CLINIC_CURRENCY = 'JOD';

export const STATUS_BADGE_VARIANT: Record<
  AppointmentStatus,
  'warning' | 'success' | 'info' | 'destructive' | 'muted'
> = {
  unconfirmed: 'warning',
  confirmed: 'success',
  checked_in: 'success',
  waiting: 'warning',
  in_progress: 'info',
  completed: 'info',
  no_show: 'destructive',
  cancelled: 'muted',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  unconfirmed: 'var(--color-warning)',
  confirmed: 'var(--color-success)',
  checked_in: 'var(--color-accent-teal)',
  waiting: 'var(--color-warning)',
  in_progress: 'var(--color-primary)',
  completed: 'var(--color-primary)',
  no_show: 'var(--color-error)',
  cancelled: 'var(--color-muted-foreground)',
};

export const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; short: string; dotClassName: string }
> = {
  unconfirmed: {
    label: 'Unconfirmed',
    short: 'Pending',
    dotClassName: 'bg-warning',
  },
  confirmed: {
    label: 'Confirmed',
    short: 'Confirmed',
    dotClassName: 'bg-success',
  },
  checked_in: {
    label: 'Checked In',
    short: 'Checked in',
    dotClassName: 'bg-success',
  },
  waiting: {
    label: 'Waiting',
    short: 'Waiting',
    dotClassName: 'bg-warning',
  },
  in_progress: {
    label: 'In Progress',
    short: 'In progress',
    dotClassName: 'bg-primary animate-pulse',
  },
  completed: {
    label: 'Completed',
    short: 'Done',
    dotClassName: 'bg-primary',
  },
  no_show: {
    label: 'No Show',
    short: 'No-show',
    dotClassName: 'bg-error',
  },
  cancelled: {
    label: 'Cancelled',
    short: 'Cancelled',
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

export const TIMELINE_START_HOUR = 7;
export const TIMELINE_END_HOUR = 21;
export const TIMELINE_PX_PER_MIN = 2;
export const TIMELINE_TOTAL_MINS =
  (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;
export const TIMELINE_TOTAL_HEIGHT = TIMELINE_TOTAL_MINS * TIMELINE_PX_PER_MIN;
export const TIMELINE_HOUR_HEIGHT = 60 * TIMELINE_PX_PER_MIN;
export const TIMELINE_HOURS = Array.from(
  { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR },
  (_, i) => i + TIMELINE_START_HOUR,
);

export const TIMELINE_DOCTOR_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
] as const;

export type ScheduleView = 'day' | 'week' | 'month' | 'doctors' | 'queue';

export const VIEW_TO_FC: Record<ScheduleView, string> = {
  day: 'timeGridDay',
  week: 'timeGridWeek',
  month: 'dayGridMonth',
  doctors: 'timeGridDay',
  queue: 'timeGridDay',
};

export const FC_TO_VIEW: Record<string, ScheduleView> = {
  timeGridDay: 'day',
  timeGridWeek: 'week',
  dayGridMonth: 'month',
};
