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
  firstNameAr?: string | null;
  lastNameAr?: string | null;
};

export function densityFromHeight(height: number): EventDensity {
  if (height < 40) return 'xs';
  if (height < 62) return 'sm';
  if (height < 108) return 'md';
  return 'lg';
}

export function formatHourLabel(hour: number, lang?: string): string {
  return formatHour(hour, lang);
}

export function formatApptTimeRange(appt: Appointment, lang?: string) {
  const start = new Date(appt.scheduledAt);
  const end = new Date(start.getTime() + appt.durationMins * 60000);
  return formatTimeRange(start, end, undefined, lang);
}

export function formatApptStartAmPm(appt: Appointment, lang?: string) {
  return formatTime(appt.scheduledAt, undefined, lang);
}

export function formatPersonName(person: NameParts, lang?: string) {
  if (lang === 'ar') {
    const ar = `${person.firstNameAr ?? ''} ${person.lastNameAr ?? ''}`.trim();
    if (ar) return ar;
  }
  return `${person.firstNameEn ?? ''} ${person.lastNameEn ?? ''}`.trim();
}

export function formatPersonShortName(person: NameParts, lang?: string) {
  if (lang === 'ar') {
    const ar = formatPersonName(person, 'ar');
    if (ar) return ar;
  }
  const first = person.firstNameEn?.trim() ?? '';
  const last = person.lastNameEn?.trim() ?? '';
  if (!first) return last;
  if (!last) return first;
  return `${first} ${last.charAt(0)}.`;
}

export function patientDisplayName(appt: Appointment, lang?: string) {
  return formatPersonName(appt.patient, lang);
}

export function patientShortName(appt: Appointment, lang?: string) {
  return formatPersonShortName(appt.patient, lang);
}

export function doctorDisplayName(
  doctor: { name?: string | null; nameAr?: string | null } | string | null | undefined,
  lang?: string,
) {
  if (!doctor) return lang === 'ar' ? 'طبيب' : 'Doctor';
  const name = typeof doctor === 'string' ? doctor : (lang === 'ar' && doctor.nameAr ? doctor.nameAr : doctor.name);
  const trimmed = name?.trim() ?? '';
  if (!trimmed) return lang === 'ar' ? 'طبيب' : 'Doctor';
  return trimmed.replace(/^(?:dr\.?|د\.?\s*)/i, '');
}

export function doctorShortName(
  doctor: { name?: string | null; nameAr?: string | null } | string | null | undefined,
  lang?: string,
) {
  const full = doctorDisplayName(doctor, lang);
  if (lang === 'ar') return full;
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return full;
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

export function formatDoctorLabel(
  doctor: { name?: string | null; nameAr?: string | null } | string | null | undefined,
  opts?: { short?: boolean; lang?: string },
) {
  const isAr = opts?.lang === 'ar';
  const label = opts?.short ? doctorShortName(doctor, opts?.lang) : doctorDisplayName(doctor, opts?.lang);
  return isAr ? `د. ${label}` : `Dr. ${label}`;
}

export function formatApptTip(
  appt: Appointment,
  extras?: { rangeLabel?: string; doctorName?: string; lang?: string },
) {
  const bits = [
    patientDisplayName(appt, extras?.lang),
    extras?.rangeLabel ?? formatApptTimeRange(appt, extras?.lang),
    formatDoctorLabel(extras?.doctorName ?? appt.doctor, { lang: extras?.lang }),
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
