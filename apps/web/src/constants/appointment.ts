import type { Translations } from '@/i18n';
import type { AppointmentStatus } from '@/services/appointments.service';
import type { BadgeVariant } from '@/components/ui/display/badge';
import { APPOINTMENT_STATUS_GROUPS, APPOINTMENT_STATUS } from '@clinic/types';

export const CLINIC_CURRENCY = 'JOD';
export const DEFAULT_DURATION_MINS = '45';

export const STATUS_GROUP_BADGE_VARIANT = {
  booked: 'violet',
  arrived: 'teal',
  inProgress: 'info',
  completed: 'success',
  closed: 'muted',
} satisfies Record<keyof typeof APPOINTMENT_STATUS_GROUPS, BadgeVariant>;

export const STATUS_BADGE_VARIANT: Record<AppointmentStatus, BadgeVariant> = {
  [APPOINTMENT_STATUS.UNCONFIRMED]: 'warning',
  [APPOINTMENT_STATUS.CONFIRMED]: 'violet',
  [APPOINTMENT_STATUS.CHECKED_IN]: 'teal',
  [APPOINTMENT_STATUS.WAITING]: 'teal',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'info',
  [APPOINTMENT_STATUS.COMPLETED]: 'success',
  [APPOINTMENT_STATUS.NO_SHOW]: 'destructive',
  [APPOINTMENT_STATUS.CANCELLED]: 'muted',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  [APPOINTMENT_STATUS.UNCONFIRMED]: 'var(--color-warning)',
  [APPOINTMENT_STATUS.CONFIRMED]: 'var(--color-accent-violet)',
  [APPOINTMENT_STATUS.CHECKED_IN]: 'var(--color-accent-teal)',
  [APPOINTMENT_STATUS.WAITING]: 'var(--color-accent-teal)',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'var(--color-info)',
  [APPOINTMENT_STATUS.COMPLETED]: 'var(--color-success)',
  [APPOINTMENT_STATUS.NO_SHOW]: 'var(--color-error)',
  [APPOINTMENT_STATUS.CANCELLED]: 'var(--color-muted-foreground)',
};

export const getStatusConfig = (
  t: Translations,
): Record<
  AppointmentStatus,
  { label: string; dotClassName: string }
> => ({
  unconfirmed: {
    ...t.constants.status.unconfirmed,
    dotClassName: 'bg-warning',
  },
  confirmed: {
    ...t.constants.status.confirmed,
    dotClassName: 'bg-accent-violet',
  },
  checked_in: {
    ...t.constants.status.checked_in,
    dotClassName: 'bg-accent-teal',
  },
  waiting: {
    ...t.constants.status.waiting,
    dotClassName: 'bg-accent-teal',
  },
  in_progress: {
    ...t.constants.status.in_progress,
    dotClassName: 'bg-info animate-pulse',
  },
  completed: {
    ...t.constants.status.completed,
    dotClassName: 'bg-success',
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

export const QUEUE_STAGE = {
  ALL: 'all',
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  CLOSED: 'closed',
} as const;
export type QueueStage = (typeof QUEUE_STAGE)[keyof typeof QUEUE_STAGE];

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
