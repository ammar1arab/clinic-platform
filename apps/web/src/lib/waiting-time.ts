import type { Appointment } from '@/services/appointments.service';

export function elapsedMinutesSince(
  dateString: string | Date | null | undefined,
  now: Date = new Date(),
) {
  if (!dateString) return 0;
  const start = new Date(dateString).getTime();
  return Math.max(0, Math.floor((now.getTime() - start) / 60_000));
}

export function formatWaitingMins(mins: number | null | undefined): string {
  if (mins == null || Number.isNaN(mins)) return '—';
  const m = Math.max(0, Math.floor(mins));
  if (m < 1) return '< 1m';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}

/** Compact elapsed label for queue timers (`12m`, `1h 5m`). */
export function formatElapsedMins(mins: number): string {
  const m = Math.max(0, Math.floor(mins));
  if (m < 1) return '< 1m';
  if (m < 60) return `${m}m`;
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${hrs}h` : `${hrs}h ${rem}m`;
}

export function resolveWaitingMins(appt: {
  status: string;
  scheduledAt: string | Date;
  waitingStartedAt?: string | Date | null;
  waitingMins?: number | null;
  now?: Date;
}): number | null {
  if (appt.waitingMins != null) return Math.max(0, appt.waitingMins);

  if (appt.status === 'waiting' || appt.status === 'checked_in') {
    return elapsedMinutesSince(
      appt.waitingStartedAt ?? appt.scheduledAt,
      appt.now ?? new Date(),
    );
  }

  return null;
}
