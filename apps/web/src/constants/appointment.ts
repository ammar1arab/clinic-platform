import type { Translations } from '@/i18n';
import type { AppointmentStatus } from '@/services/appointments.service';
import { APPOINTMENT_STATUS } from '@clinic/types';

export const CLINIC_CURRENCY = 'JOD';
export const DEFAULT_DURATION_MINS = '45';

export const STATUS_BADGE_VARIANT: Record<
  AppointmentStatus,
  'warning' | 'success' | 'info' | 'destructive' | 'muted'
> = {
  [APPOINTMENT_STATUS.UNCONFIRMED]: 'warning',
  [APPOINTMENT_STATUS.CONFIRMED]: 'success',
  [APPOINTMENT_STATUS.CHECKED_IN]: 'success',
  [APPOINTMENT_STATUS.WAITING]: 'warning',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'info',
  [APPOINTMENT_STATUS.COMPLETED]: 'info',
  [APPOINTMENT_STATUS.NO_SHOW]: 'destructive',
  [APPOINTMENT_STATUS.CANCELLED]: 'muted',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  [APPOINTMENT_STATUS.UNCONFIRMED]: 'var(--color-warning)',
  [APPOINTMENT_STATUS.CONFIRMED]: 'var(--color-success)',
  [APPOINTMENT_STATUS.CHECKED_IN]: 'var(--color-accent-teal)',
  [APPOINTMENT_STATUS.WAITING]: 'var(--color-warning)',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'var(--color-primary)',
  [APPOINTMENT_STATUS.COMPLETED]: 'var(--color-primary)',
  [APPOINTMENT_STATUS.NO_SHOW]: 'var(--color-error)',
  [APPOINTMENT_STATUS.CANCELLED]: 'var(--color-muted-foreground)',
};

export const getStatusConfig = (
  t: Translations,
): Record<
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
  APPOINTMENT_STATUS.UNCONFIRMED,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.CHECKED_IN,
  APPOINTMENT_STATUS.WAITING,
  APPOINTMENT_STATUS.IN_PROGRESS,
  APPOINTMENT_STATUS.COMPLETED,
  APPOINTMENT_STATUS.NO_SHOW,
  APPOINTMENT_STATUS.CANCELLED,
];

export const SCHEDULE_FILTER_STATUSES: AppointmentStatus[] = [
  APPOINTMENT_STATUS.UNCONFIRMED,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.IN_PROGRESS,
  APPOINTMENT_STATUS.COMPLETED,
  APPOINTMENT_STATUS.NO_SHOW,
  APPOINTMENT_STATUS.CANCELLED,
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
  'var(--color-primary)',
  'var(--color-accent-teal)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-error)',
  'var(--color-foreground)',
  'var(--color-secondary-foreground)',
  'var(--color-muted-foreground)',
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
