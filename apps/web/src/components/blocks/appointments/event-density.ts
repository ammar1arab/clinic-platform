import type { Appointment } from '@/services/appointments.service';

export type EventDensity = 'xs' | 'sm' | 'md' | 'lg';

export function densityFromHeight(height: number): EventDensity {
  if (height < 34) return 'xs';
  if (height < 52) return 'sm';
  if (height < 90) return 'md';
  return 'lg';
}

export function patientDisplayName(appt: Appointment) {
  return `${appt.patient.firstNameEn} ${appt.patient.lastNameEn}`.trim();
}

export function patientShortName(appt: Appointment) {
  const first = appt.patient.firstNameEn?.trim() ?? '';
  const last = appt.patient.lastNameEn?.trim() ?? '';
  if (!first) return last;
  if (!last) return first;
  return `${first} ${last.charAt(0)}.`;
}

export function formatCompactTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const label = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return label.replace(/\s?(AM|PM)/i, (_, m: string) => m.charAt(0).toLowerCase());
}
