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
  brandColor: string | null;
  letterheadFooter: string | null;
  defaultCalendarView: CalendarView;
  defaultSessionType: SessionType;
  defaultDepartmentId: string | null;
  updatedAt: string;
}

export interface UpdateClinicInput {
  name?: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string | null;
  brandColor?: string | null;
  letterheadFooter?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  defaultCalendarView?: CalendarView;
  defaultSessionType?: SessionType;
  defaultDepartmentId?: string | null;
  timezone?: string;
}


export interface AccountProfileInput { email?: string; name: string; imageUrl: string; nameAr?: string; phone?: string; }

export interface AuthMe {
  imageUrl?: string | null;
  nameAr?: string | null;
  phone?: string | null;
  userId: string;
  clinicUserId: string;
  role: Role;
  name: string;
  email: string;
  clinic: ClinicSummary;
}

export interface ClinicStaffMember {
  email?: string;
  id: string;
  name: string;
  nameAr: string | null;
  role: Role | string;
  initials: string | null;
}

export interface AuthSessionResponse { user: AuthMe | null; }
