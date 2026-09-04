import type { Translations } from '@/i18n';
import type { AppointmentStatus } from '@/services/appointments.service';

export const CLINIC_CURRENCY = 'JOD';
export const DEFAULT_DURATION_MINS = '45';

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

export const getStatusConfig = (t: Translations): Record<
  AppointmentStatus,
  { label: string; short: string; dotClassName: string }
> => ({
  unconfirmed: {
    ...t.constants.status.unconfirmed,
    dotClassName: 'bg-warning',
  },
  confirmed: {
    ...t.constants.status.confirmed,
    dotClassName: 'bg-success',
  },
  checked_in: {
    ...t.constants.status.checked_in,
    dotClassName: 'bg-success',
  },
  waiting: {
    ...t.constants.status.waiting,
    dotClassName: 'bg-warning',
  },
  in_progress: {
    ...t.constants.status.in_progress,
    dotClassName: 'bg-primary animate-pulse',
  },
  completed: {
    ...t.constants.status.completed,
    dotClassName: 'bg-primary',
  },
  no_show: {
    ...t.constants.status.no_show,
    dotClassName: 'bg-error',
  },
  cancelled: {
    ...t.constants.status.cancelled,
    dotClassName: 'bg-muted-foreground',
  },
});

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
