import type { Appointment } from '@/services/appointments.service';

export interface TimelineDoctor {
  id: string;
  name: string;
  color: string;
}

export interface PositionedAppt {
  appt: Appointment;
  doctor: TimelineDoctor | undefined;
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
}

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
];

function toMinutes(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getHours() * 60 + d.getMinutes();
}

export function layoutTimelineAppts(
  appts: Appointment[],
  doctors: Map<string, TimelineDoctor>,
): PositionedAppt[] {
  const sorted = [...appts].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  const colEnd: number[] = [];
  const colMap = new Map<string, number>();

  for (const appt of sorted) {
    const startMin = toMinutes(appt.scheduledAt);
    let col = colEnd.findIndex((end) => end <= startMin);
    if (col === -1) col = colEnd.length;
    colEnd[col] = startMin + appt.durationMins;
    colMap.set(appt.id, col);
  }

  return sorted.map((appt) => {
    const startMin = toMinutes(appt.scheduledAt);
    const endMin = startMin + appt.durationMins;
    const col = colMap.get(appt.id) ?? 0;

    let maxCols = 1;
    for (const other of sorted) {
      if (other.id === appt.id) continue;
      const oStart = toMinutes(other.scheduledAt);
      const oEnd = oStart + other.durationMins;
      if (oStart < endMin && oEnd > startMin) {
        maxCols = Math.max(maxCols, (colMap.get(other.id) ?? 0) + 1, col + 1);
      }
    }

    const top = Math.max(0, startMin - TIMELINE_START_HOUR * 60) * TIMELINE_PX_PER_MIN;
    const height = Math.max(32, appt.durationMins * TIMELINE_PX_PER_MIN);
    const gutter = maxCols > 1 ? 1.5 : 0;

    return {
      appt,
      doctor: doctors.get(appt.doctorId),
      top,
      height,
      leftPct: (col / maxCols) * 100 + gutter / 2,
      widthPct: (1 / maxCols) * 100 - gutter,
    };
  });
}
