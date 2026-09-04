import type { Appointment } from '@/services/appointments.service';
import {
  formatHour,
  formatTime,
  formatTimeRange,
} from '@/lib/datetime';
import { getBilingualName, getTranslations } from '@/i18n';

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

export function patientDisplayName(appt: Appointment, lang?: string) {
  return formatPersonName(appt.patient, lang);
}

export function doctorDisplayName(
  doctor: { name?: string | null; nameAr?: string | null } | string | null | undefined,
  lang?: string,
) {
  const fallback = getTranslations(lang).appointments.doctor;
  if (!doctor) return fallback;
  const name =
    typeof doctor === 'string'
      ? doctor
      : getBilingualName(doctor.name, doctor.nameAr, lang);
  const trimmed = name?.trim() ?? '';
  if (!trimmed) return fallback;
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
  const prefix = getTranslations(opts?.lang).appointments.doctorPrefix;
  const label = opts?.short ? doctorShortName(doctor, opts?.lang) : doctorDisplayName(doctor, opts?.lang);
  return `${prefix} ${label}`;
}

export function staffRoleLabel(role: string | null | undefined, lang?: string) {
  if (!role) return '';
  const t = getTranslations(lang);
  const labels: Record<string, string> = {
    owner: t.appointments.roleOwner,
    admin: t.appointments.roleAdmin,
    practitioner: t.appointments.rolePractitioner,
    financial: t.appointments.roleFinancial,
    receptionist: t.appointments.roleReceptionist,
    nurse: t.appointments.roleNurse,
  };
  return ` · ${labels[role.toLowerCase()] || role.replace(/_/g, ' ')}`;
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
  if (appt.service) {
    bits.push(getBilingualName(appt.service.name, appt.service.nameAr, extras?.lang));
  }
  return bits.join(' · ');
}

export function matchesAppointmentSearch(appt: Appointment, term: string) {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return [
    formatPersonName(appt.patient, 'en'),
    formatPersonName(appt.patient, 'ar'),
    appt.service?.name,
    appt.service?.nameAr,
    appt.doctor?.name,
    appt.doctor?.nameAr,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(q);
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
