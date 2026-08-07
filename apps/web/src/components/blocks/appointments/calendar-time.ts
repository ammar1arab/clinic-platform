import { Appointment } from '@/services/appointments.service';

export function formatTimeAmPm(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatApptTimeRange(appt: Appointment) {
  const start = new Date(appt.scheduledAt);
  const end = new Date(start.getTime() + appt.durationMins * 60000);
  return `${formatTimeAmPm(start)} – ${formatTimeAmPm(end)}`;
}

export function formatApptStartAmPm(appt: Appointment) {
  return formatTimeAmPm(appt.scheduledAt);
}

export {
  patientDisplayName,
  patientShortName,
  formatCompactTime,
  densityFromHeight,
  type EventDensity,
} from './event-density';
