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

export function formatCompactTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const label = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return label.replace(/\s?(AM|PM)/i, (_, m: string) => m.charAt(0).toLowerCase());
}

export function formatApptTip(
  appt: Appointment,
  extras?: { rangeLabel?: string; doctorName?: string },
) {
  const patient = patientDisplayName(appt);
  const range =
    extras?.rangeLabel ??
    (() => {
      const start = new Date(appt.scheduledAt);
      const end = new Date(start.getTime() + appt.durationMins * 60000);
      const fmt = (d: Date) =>
        d.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      return `${fmt(start)} – ${fmt(end)}`;
    })();
  const doctor = doctorDisplayName(extras?.doctorName ?? appt.doctor?.name);
  const bits = [patient, range, `Dr. ${doctor}`];
  if (appt.service?.name) bits.push(appt.service.name);
  return bits.join(' · ');
}
