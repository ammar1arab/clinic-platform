import type { ReferralStatus, ReferralType, ReferralUrgency } from './enums';

export interface Referral {
  id: string;
  clinicId: string;
  appointmentId: string;
  fromDoctorId: string;
  toDoctorId: string;
  type: ReferralType;
  urgency: ReferralUrgency;
  reason: string;
  opinion: string | null;
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
  fromDoctor?: { id: string; name: string; nameAr?: string | null };
  toDoctor?: { id: string; name: string; nameAr?: string | null };
  appointment?: {
    id: string;
    scheduledAt: string;
    patient?: { id: string; firstNameEn: string; lastNameEn: string };
  };
}

export interface CreateReferralInput {
  clinicId: string;
  appointmentId: string;
  toDoctorId: string;
  type: ReferralType;
  urgency?: ReferralUrgency;
  reason: string;
}

export interface ReferralFilters {
  clinicId: string;
  patientId?: string;
  toDoctorId?: string;
  status?: ReferralStatus;
}
