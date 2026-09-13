

export type Role = 'owner' | 'admin' | 'practitioner' | 'financial';

export const ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  PRACTITIONER: 'practitioner',
  FINANCIAL: 'financial',
} as const satisfies Record<string, Role>;

export type SessionType = 'in_person' | 'online';

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
