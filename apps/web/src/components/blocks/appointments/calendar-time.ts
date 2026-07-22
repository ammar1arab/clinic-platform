import { Appointment } from '@/services/appointments.service';

/** 12-hour clock, e.g. "9:00 AM" */
export function formatTimeAmPm(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** e.g. "9:00 AM – 9:45 AM" */
export function formatApptTimeRange(appt: Appointment) {
  const start = new Date(appt.scheduledAt);
  const end = new Date(start.getTime() + appt.durationMins * 60000);
  return `${formatTimeAmPm(start)} – ${formatTimeAmPm(end)}`;
}

/** Short start time for month chips, e.g. "9:00 AM" */
export function formatApptStartAmPm(appt: Appointment) {
  return formatTimeAmPm(appt.scheduledAt);
}

export function patientDisplayName(appt: Appointment) {
  return `${appt.patient.firstNameEn} ${appt.patient.lastNameEn}`.trim();
}
