import type { PractitionerDetail } from '@/services/practitioners.service';
import { clinicDateTimeToIso, isoToClinicDateTime, pad2 } from '@/lib/datetime';

type PractitionerSchedule = Pick<PractitionerDetail, 'availabilities' | 'timeOffs' | 'availabilityOverrides'>;

export function isPractitionerAvailable(
  schedule: PractitionerSchedule,
  date: string,
  hours: number,
  minutes: number,
  durationMins: number,
  timeZone: string,
) {
  const from = `${pad2(hours)}:${pad2(minutes)}`;
  const start = new Date(clinicDateTimeToIso(date, from, timeZone));
  const end = new Date(start.getTime() + durationMins * 60_000);
  const endLocal = isoToClinicDateTime(end, timeZone);

  if (schedule.timeOffs.some((entry) => new Date(entry.startDate) < end && new Date(entry.endDate) > start)) return false;
  if (schedule.availabilityOverrides.some((entry) => new Date(entry.startAt) <= start && new Date(entry.endAt) >= end)) return true;

  const weekly = schedule.availabilities.filter((slot) => slot.isActive !== false);
  if (!weekly.length) return true;
  if (endLocal.date !== date) return false;

  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return weekly.some((slot) =>
    slot.dayOfWeek === weekday
    && slot.startTime <= from
    && slot.endTime >= endLocal.time
    && (!slot.effectiveFrom || slot.effectiveFrom.slice(0, 10) <= date)
    && (!slot.effectiveUntil || slot.effectiveUntil.slice(0, 10) >= date));
}
