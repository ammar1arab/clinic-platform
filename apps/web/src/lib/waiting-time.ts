
export function formatWaitingMins(mins: number | null | undefined): string {
  if (mins == null || Number.isNaN(mins)) return '—';
  const m = Math.max(0, Math.floor(mins));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
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
    const start = new Date(appt.waitingStartedAt ?? appt.scheduledAt);
    const now = appt.now ?? new Date();
    return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60_000));
  }

  return null;
}
