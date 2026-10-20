import type { NotificationDTO } from '@clinic/types';
import { ROUTES } from '@/constants/routes';
import type { Translations } from '@/i18n';
import { formatDate, formatDateTime } from '@/lib/datetime';
import { elapsedMinutesSince, formatWaitingMins } from '@/lib/waiting-time';

const text = (value: unknown) => (typeof value === 'string' && value ? value : null);

export function notificationCopy(item: NotificationDTO, t: Translations, lang: string) {
  const payload = item.payload ?? {};
  const types: Record<string, string> = t.notifications.types;
  const known = types[item.type];
  if (!known) {
    const title = lang === 'ar' ? (text(payload.titleAr) ?? item.title) : item.title;
    return { title, body: item.body };
  }
  const patient = lang === 'ar' ? (text(payload.patientNameAr) ?? text(payload.patientName)) : text(payload.patientName);
  const scheduledAt = text(payload.scheduledAt) ?? text(payload.documentationDeadlineAt);
  const when = scheduledAt ? formatDateTime(scheduledAt, '', lang) : null;
  return { title: known, body: [patient, when].filter(Boolean).join(' · ') || (item.type === 'referral_created' ? item.body : null) };
}

export function notificationHref(item: NotificationDTO) {
  if (item.type.startsWith('schedule_request_')) {
    return item.type === 'schedule_request_pending' ? ROUTES.SETTINGS_SCHEDULE_REQUESTS : `${ROUTES.SETTINGS_SCHEDULE_REQUESTS}?view=history`;
  }
  const appointmentId = text(item.payload?.appointmentId);
  if (!appointmentId) return null;
  return item.type.startsWith('appointment_') ? ROUTES.SCHEDULE_EDIT(appointmentId) : ROUTES.VISIT(appointmentId);
}

export function notificationAge(createdAt: string, t: Translations, lang: string, now: Date) {
  const mins = elapsedMinutesSince(createdAt, now);
  if (mins < 1) return t.notifications.now;
  if (mins < 24 * 60) return t.notifications.ago.replace('{time}', formatWaitingMins(mins, t));
  return formatDate(createdAt, undefined, lang);
}
