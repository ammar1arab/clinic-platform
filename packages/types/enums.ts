

export type Locale = 'en' | 'ar';

export const LOCALE = {
  EN: 'en',
  AR: 'ar',
} as const satisfies Record<string, Locale>;

export type Role = 'owner' | 'admin' | 'practitioner' | 'financial';

export const ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  PRACTITIONER: 'practitioner',
  FINANCIAL: 'financial',
} as const satisfies Record<string, Role>;

export type EmailDeliveryStatus =
  | 'queued'
  | 'processing'
  | 'accepted'
  | 'delivered'
  | 'delayed'
  | 'bounced'
  | 'complained'
  | 'failed'
  | 'suppressed';

export const EMAIL_DELIVERY_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  ACCEPTED: 'accepted',
  DELIVERED: 'delivered',
  DELAYED: 'delayed',
  BOUNCED: 'bounced',
  COMPLAINED: 'complained',
  FAILED: 'failed',
  SUPPRESSED: 'suppressed',
} as const satisfies Record<string, EmailDeliveryStatus>;

export type EmailAudience =
  | 'owners'
  | 'patients'
  | 'practitioners'
  | 'financial'
  | 'admins';

export const EMAIL_AUDIENCE = {
  OWNERS: 'owners',
  PATIENTS: 'patients',
  PRACTITIONERS: 'practitioners',
  FINANCIAL: 'financial',
  ADMINS: 'admins',
} as const satisfies Record<string, EmailAudience>;

export type SessionType = 'in_person' | 'online';

export const SESSION_TYPE = {
  IN_PERSON: 'in_person',
  ONLINE: 'online',
} as const satisfies Record<string, SessionType>;

export type DiscountType = 'fixed' | 'percentage';

export type EmploymentType = 'salaried' | 'commission' | 'mixed';

export type AppointmentStatus =
  | 'unconfirmed'
  | 'confirmed'
  | 'checked_in'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'no_show'
  | 'cancelled';

export const APPOINTMENT_STATUS = {
  UNCONFIRMED: 'unconfirmed',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, AppointmentStatus>;

export type CalendarView = 'day' | 'week' | 'month';

export type ReportFormat = 'pdf' | 'xlsx' | 'csv' | 'docx';

export type ReferralType = 'referral' | 'consultation';
export type ReferralUrgency = 'normal' | 'high' | 'urgent';
export type ReferralStatus = 'pending' | 'accepted' | 'rejected';

export type SortOrder = 'asc' | 'desc';

export type PatientSortBy =
  | 'createdAt'
  | 'updatedAt'
  | 'firstNameEn'
  | 'lastNameEn'
  | 'dob'
  | 'appointments';

export type ServiceSessionMode = SessionType;

export function isValueOf<T extends string>(
  values: Record<string, T>,
  value: string | null | undefined,
): value is T {
  return !!value && (Object.values(values) as string[]).includes(value);
}
