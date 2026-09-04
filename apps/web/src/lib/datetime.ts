import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { getTranslations } from '@/i18n';

const CLOCK_RE = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;
const RANGE_SEP = ' – ';
const EMPTY = '—';

export type ClockParts = { hours: number; minutes: number };

export function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function parseClock(
  value: string | null | undefined,
): ClockParts | null {
  if (!value) return null;
  const match = CLOCK_RE.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

export function toClockValue(hours: number, minutes: number) {
  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function formatClockParts(
  hours: number,
  minutes: number,
  lang?: string,
) {
  const hour12 = hours % 12 || 12;
  const t = getTranslations(lang ?? 'en');
  const period = hours < 12 ? t.time.am : t.time.pm;
  if (minutes === 0) return `${hour12} ${period}`;
  return `${hour12}:${pad2(minutes)} ${period}`;
}

export function formatHour(hour: number, lang?: string) {
  const normalized = ((Math.trunc(hour) % 24) + 24) % 24;
  return formatClockParts(normalized, 0, lang);
}

export function formatClock(
  value: string | null | undefined,
  empty = EMPTY,
  lang?: string,
) {
  const clock = parseClock(value);
  if (!clock) return empty;
  return formatClockParts(clock.hours, clock.minutes, lang);
}

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string') {
    const clock = parseClock(value);
    if (clock) {
      const next = new Date();
      next.setHours(clock.hours, clock.minutes, 0, 0);
      return next;
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatTime(
  value: Date | string | number | null | undefined,
  empty = EMPTY,
  lang?: string,
) {
  const date = toDate(value);
  if (!date) return empty;
  return formatClockParts(date.getHours(), date.getMinutes(), lang);
}

export function formatTimeRange(
  start: Date | string | number | null | undefined,
  end: Date | string | number | null | undefined,
  empty = EMPTY,
  lang?: string,
) {
  return `${formatTime(start, empty, lang)}${RANGE_SEP}${formatTime(end, empty, lang)}`;
}

export function formatDate(
  value: Date | string | number | null | undefined,
  empty = EMPTY,
  lang = 'en',
) {
  const date = toDate(value);
  if (!date) return empty;
  return format(date, 'MMM d, yyyy', { locale: lang === 'ar' ? ar : enUS });
}

export function formatDateTime(
  value: Date | string | number | null | undefined,
  empty = EMPTY,
  lang = 'en',
) {
  const date = toDate(value);
  if (!date) return empty;
  return `${formatDate(date, empty, lang)} · ${formatTime(date, empty, lang)}`;
}

export function toDateParam(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toTimeParam(date: Date) {
  return toClockValue(date.getHours(), date.getMinutes());
}
