import type { CalendarView, Role, SessionType } from './enums';

export interface ClinicSummary {
  id: string;
  name: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  timezone: string;
}

export interface Clinic extends ClinicSummary {
  nameAr: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  letterheadFooter: string | null;
  defaultCalendarView: CalendarView;
  defaultSessionType: SessionType;
  defaultDepartmentId: string | null;
}

export interface UpdateClinicInput {
  name?: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  letterheadFooter?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  defaultCalendarView?: CalendarView;
  defaultSessionType?: SessionType;
  defaultDepartmentId?: string | null;
  timezone?: string;
}

/** Logged-in session payload from GET /auth/me */
export interface AuthMe {
  userId: string;
  clinicUserId: string;
  role: Role;
  name: string;
  email: string;
  clinic: ClinicSummary;
}

export interface AuthTokenResponse {
  accessToken: string;
}

/** Clinic staff row (ClinicUser) for pickers / staff lists */
export interface ClinicStaffMember {
  id: string;
  name: string;
  role: Role | string;
  initials: string | null;
}
