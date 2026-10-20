import { ROLE, type Role } from "./enums";

export const NOTIFICATION_CATEGORY = {
  REFERRALS: "referrals",
  DOCUMENTATION: "documentation",
  APPOINTMENTS: "appointments",
  QUEUE: "queue",
  SCHEDULE_REQUESTS: "scheduleRequests",
} as const;
export type NotificationCategory =
  (typeof NOTIFICATION_CATEGORY)[keyof typeof NOTIFICATION_CATEGORY];
export type NotificationPrefs = Record<NotificationCategory, boolean>;
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  referrals: true,
  documentation: true,
  appointments: true,
  queue: true,
  scheduleRequests: true,
};
export function notificationCategoryOf(type: string): NotificationCategory | null {
  if (type.startsWith("referral_")) return NOTIFICATION_CATEGORY.REFERRALS;
  if (type.startsWith("documentation_")) return NOTIFICATION_CATEGORY.DOCUMENTATION;
  if (type.startsWith("appointment_")) return NOTIFICATION_CATEGORY.APPOINTMENTS;
  if (type.startsWith("schedule_request_")) return NOTIFICATION_CATEGORY.SCHEDULE_REQUESTS;
  if (type.startsWith("queue_")) return NOTIFICATION_CATEGORY.QUEUE;
  return null;
}
export function resolveNotificationPrefs(raw: unknown): NotificationPrefs {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    referrals: value.referrals !== false,
    documentation: value.documentation !== false,
    appointments: value.appointments !== false,
    queue: value.queue !== false,
    scheduleRequests: value.scheduleRequests !== false,
  };
}
export function notificationCategoriesForRole(role?: Role | null): readonly NotificationCategory[] {
  if (role === ROLE.PRACTITIONER) return Object.values(NOTIFICATION_CATEGORY);
  if (role === ROLE.OWNER) return [NOTIFICATION_CATEGORY.DOCUMENTATION, NOTIFICATION_CATEGORY.SCHEDULE_REQUESTS];
  if (role === ROLE.ADMIN) return [NOTIFICATION_CATEGORY.SCHEDULE_REQUESTS];
  return [];
}

export const NOTIFICATION_TYPE = {
  APPOINTMENT_BOOKED: "appointment_booked",
  APPOINTMENT_RESCHEDULED: "appointment_rescheduled",
  APPOINTMENT_CANCELLED: "appointment_cancelled",
  QUEUE_PATIENT_WAITING: "queue_patient_waiting",
} as const;
export type NotificationDTO = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};
export const NOTIFICATION_LIMIT = 100;
export const NOTIFICATION_RETENTION_DAYS = 30;
