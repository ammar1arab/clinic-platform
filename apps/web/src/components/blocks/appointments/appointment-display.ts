import type { Appointment } from '@/services/appointments.service';

export type EventDensity = 'xs' | 'sm' | 'md' | 'lg';

export type NameParts = {
  firstNameEn?: string | null;
  lastNameEn?: string | null;
};

export function densityFromHeight(height: number): EventDensity {
  if (height < 34) return 'xs';
  if (height < 52) return 'sm';
  if (height < 90) return 'md';
  return 'lg';
}

export function formatTimeAmPm(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatCompactTime(date: Date | string) {
  return formatTimeAmPm(date).replace(/\s?(AM|PM)/i, (_, mer: string) =>
    mer.charAt(0).toLowerCase(),
  );
}

export function formatHourLabel(hour: number): string {
  if (hour === 0 || hour === 12) return `12 ${hour === 0 ? 'AM' : 'PM'}`;
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

export function formatApptTimeRange(appt: Appointment) {
  const start = new Date(appt.scheduledAt);
  const end = new Date(start.getTime() + appt.durationMins * 60000);
  return `${formatTimeAmPm(start)} – ${formatTimeAmPm(end)}`;
}

export function formatApptStartAmPm(appt: Appointment) {
  return formatTimeAmPm(appt.scheduledAt);
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

export function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function toDateParam(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toTimeParam(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
