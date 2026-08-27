import type { Appointment } from '@/services/appointments.service';
import {
  formatHour,
  formatTime,
  formatTimeRange,
} from '@/lib/datetime';

export type EventDensity = 'xs' | 'sm' | 'md' | 'lg';

export type NameParts = {
  firstNameEn?: string | null;
  lastNameEn?: string | null;
};

export function densityFromHeight(height: number): EventDensity {
  if (height < 40) return 'xs';
  if (height < 62) return 'sm';
  if (height < 108) return 'md';
  return 'lg';
}

export function formatHourLabel(hour: number): string {
  return formatHour(hour);
}

export function formatApptTimeRange(appt: Appointment) {
  const start = new Date(appt.scheduledAt);
  const end = new Date(start.getTime() + appt.durationMins * 60000);
  return formatTimeRange(start, end);
}

export function formatApptStartAmPm(appt: Appointment) {
  return formatTime(appt.scheduledAt);
}

export function formatPersonName(person: NameParts) {
  return `${person.firstNameEn ?? ''} ${person.lastNameEn ?? ''}`.trim();
}

export function formatPersonShortName(person: NameParts) {
  const first = person.firstNameEn?.trim() ?? '';
  const last = person.lastNameEn?.trim() ?? '';
  if (!first) return last;
  if (!last) return first;
  return `${first} ${last.charAt(0)}.`;
}

export function patientDisplayName(appt: Appointment) {
  return formatPersonName(appt.patient);
}

export function patientShortName(appt: Appointment) {
  return formatPersonShortName(appt.patient);
}

export function doctorDisplayName(name: string | null | undefined) {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) return 'Doctor';
  return trimmed.replace(/^dr\.?\s+/i, '');
}

export function doctorShortName(name: string | null | undefined) {
  const full = doctorDisplayName(name);
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return full;
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

export function formatDoctorLabel(
  name: string | null | undefined,
  opts?: { short?: boolean },
) {
  const label = opts?.short ? doctorShortName(name) : doctorDisplayName(name);
  return `Dr. ${label}`;
}

export function formatApptTip(
  appt: Appointment,
  extras?: { rangeLabel?: string; doctorName?: string },
) {
  const bits = [
    patientDisplayName(appt),
    extras?.rangeLabel ?? formatApptTimeRange(appt),
    formatDoctorLabel(extras?.doctorName ?? appt.doctor?.name),
  ];
  if (appt.service?.name) bits.push(appt.service.name);
  return bits.join(' · ');
}

export function appointmentSearchText(appt: Appointment) {
  return [
    formatPersonName(appt.patient),
    appt.service?.name ?? '',
    appt.doctor?.name ?? '',
  ]
    .join(' ')
    .toLowerCase();
}

export function matchesAppointmentSearch(appt: Appointment, term: string) {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return appointmentSearchText(appt).includes(q);
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
