import { ROUTES } from '@/constants/routes';

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

export function parseScheduleView(value: string | null | undefined): ScheduleView {
  if (
    value === 'day' ||
    value === 'week' ||
    value === 'month' ||
    value === 'doctors' ||
    value === 'queue'
  ) {
    return value;
  }
  return 'month';
}

export function schedulePath(view: ScheduleView = 'month'): string {
  const params = new URLSearchParams();
  params.set('view', view);
  return `${ROUTES.SCHEDULE}?${params.toString()}`;
}

export function resolveReturnTo(
  returnTo: string | null | undefined,
  fallback: string,
): string {
  if (!returnTo) return fallback;
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) return fallback;
  return returnTo;
}

export function rangeFromVisible(start: Date, end: Date) {
  return {
    startDate: new Date(start.getFullYear(), start.getMonth() - 1, 1).toISOString(),
    endDate: new Date(end.getFullYear(), end.getMonth() + 2, 0).toISOString(),
  };
}

export function initialScheduleRange() {
  const now = new Date();
  return rangeFromVisible(
    new Date(now.getFullYear(), now.getMonth(), 1),
    new Date(now.getFullYear(), now.getMonth() + 1, 0),
  );
}
