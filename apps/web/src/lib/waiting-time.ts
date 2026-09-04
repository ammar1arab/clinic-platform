import { translations, type Translations } from '@/i18n';
export function elapsedMinutesSince(
  dateString: string | Date | null | undefined,
  now: Date = new Date(),
) {
  if (!dateString) return 0;
  return Math.max(
    0,
    Math.floor((now.getTime() - new Date(dateString).getTime()) / 60_000),
  );
}

export function formatWaitingMins(
  mins: number | null | undefined,
  compact = false,
  t: Translations = translations.en,
): string {
  if (mins == null || Number.isNaN(mins)) return '—';
  const m = Math.max(0, Math.floor(mins));
  if (m < 1) return t.common.lessThanOneMin;
  if (m < 60)
    return compact ? `${m}${t.common.minsCompact}` : `${m} ${t.common.mins}`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  const hLabel = t.common.hours;
  const mLabel = t.common.minsCompact;
  return rem === 0 ? `${h}${hLabel}` : `${h}${hLabel} ${rem}${mLabel}`;
}

export function resolveWaitingMins(appt: {
  status: string;
  scheduledAt: string | Date;
  waitingStartedAt?: string | Date | null;
  waitingMins?: number | null;
  now?: Date;
}): number | null {
  if (appt.waitingMins != null) return Math.max(0, appt.waitingMins);
  if (appt.status !== 'waiting' && appt.status !== 'checked_in') return null;
  return elapsedMinutesSince(
    appt.waitingStartedAt ?? appt.scheduledAt,
    appt.now ?? new Date(),
  );
}
