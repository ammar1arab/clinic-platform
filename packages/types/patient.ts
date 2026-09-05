import type { DiscountType, PatientSortBy, SortOrder } from './enums';
import type {
  AppointmentStatus,
  SessionType,
} from './enums';
import type { ReferralStatus, ReferralType, ReferralUrgency } from './enums';

export interface PatientPackageSummary {
  id: string;
  name: string;
  price: string | null;
  discountType: DiscountType | null;
  discountValue: string | null;
}

export interface PatientDiscountCodeSummary {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: string;
  isActive: boolean;
}


export interface PatientProfileFields {
  firstNameAr: string | null;
  lastNameAr: string | null;
  nationalId: string | null;
  phone: string | null;
  email: string | null;
  dob: string | null;
  gender: string | null;
  bloodType: string | null;
  allergies: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  address: string | null;
  imageUrl: string | null;
  packageId: string | null;
  discountCodeId: string | null;
}

export interface Patient extends PatientProfileFields {
  id: string;
  firstNameEn: string;
  lastNameEn: string;
  primaryDoctorId: string | null;
  primaryDoctorName: string | null;
  package?: PatientPackageSummary | null;
  discountCode?: PatientDiscountCodeSummary | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalSessions: number;
  firstVisit: string | null;
  lastVisit: string | null;
  isLoyal: boolean;
}

export interface PatientDetailAppointment {
  id: string;
  scheduledAt: string;
  status: AppointmentStatus | string;
  sessionType: SessionType | string;
  fee: string | null;
  discount: string | null;
  discountType: DiscountType | null;
  isPaid: boolean;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentMethodRef?: { id: string; name: string } | null;
  doctor: { name: string; nameAr?: string | null };
  service: { name: string; nameAr?: string | null } | null;
  room: { name: string; nameAr?: string | null } | null;
}

export interface PatientDetailReferral {
  id: string;
  type: ReferralType | string;
  urgency: ReferralUrgency | string;
  status: ReferralStatus | string;
  reason: string;
  createdAt: string;
  fromDoctor?: { id: string; name: string; nameAr?: string | null };
  toDoctor?: { id: string; name: string; nameAr?: string | null };
  appointment?: { id: string; scheduledAt: string; status: string };
}

export interface PatientDetail extends PatientProfileFields {
  id: string;
  clinicId: string;
  firstNameEn: string;
  lastNameEn: string;
  primaryDoctorId: string | null;
  package?: (PatientPackageSummary & { isActive?: boolean }) | null;
  discountCode?: PatientDiscountCodeSummary | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  appointments: PatientDetailAppointment[];
  referrals?: PatientDetailReferral[];
}

export interface PatientFilters {
  clinicId: string;
  search?: string;
  isActive?: boolean;
  gender?: string;
  bloodType?: string;
  primaryDoctorId?: string;
  departmentId?: string;
  visitFrom?: string;
  visitTo?: string;
  dobFrom?: string;
  dobTo?: string;
  sortBy?: PatientSortBy;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface CreatePatientInput {
  clinicId: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameAr?: string;
  lastNameAr?: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  dob?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  imageUrl?: string;
  packageId?: string | null;
  discountCodeId?: string | null;
}

export type UpdatePatientInput = Partial<Omit<CreatePatientInput, 'clinicId'>>;
