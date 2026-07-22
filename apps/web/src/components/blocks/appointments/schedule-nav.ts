import { ROUTES } from '@/constants/routes';

export type ScheduleView = 'day' | 'week' | 'month';

export const VIEW_TO_FC = {
  day: 'timeGridDay',
  week: 'timeGridWeek',
  month: 'dayGridMonth',
} as const satisfies Record<ScheduleView, string>;

export const FC_TO_VIEW: Record<string, ScheduleView> = {
  timeGridDay: 'day',
  timeGridWeek: 'week',
  dayGridMonth: 'month',
};

export function parseScheduleView(value: string | null | undefined): ScheduleView {
  if (value === 'day' || value === 'week' || value === 'month') return value;
  return 'week';
}

/** Build `/schedule?view=…` so return navigations restore Day/Week/Month. */
export function schedulePath(view: ScheduleView = 'week'): string {
  const params = new URLSearchParams();
  params.set('view', view);
  return `${ROUTES.SCHEDULE}?${params.toString()}`;
}

/** Resolve a safe return path; only allow same-origin app paths. */
export function resolveReturnTo(
  returnTo: string | null | undefined,
  fallback: string,
): string {
  if (!returnTo) return fallback;
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) return fallback;
  return returnTo;
}
