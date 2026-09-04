import type { AppointmentStatus, DiscountType, SessionType } from './enums';

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  departmentId: string | null;
  roomId: string | null;
  serviceId: string | null;
  scheduledAt: string;
  durationMins: number;
  sessionType: SessionType;
  status: AppointmentStatus;
  statusReason: string | null;
  statusUpdatedAt: string | null;
  waitingStartedAt: string | null;
  inProgressAt: string | null;
  waitingMins: number | null;
  cancelReason: string | null;
  notes: string | null;
  fee: string | null;
  discount: string | null;
  discountType: DiscountType | null;
  discountReason: string | null;
  isPaid: boolean;
  paidAt: string | null;

  paymentMethod: string | null;
  paymentMethodId: string | null;
  paymentMethodRef?: { id: string; name: string } | null;

  patientPackageId: string | null;

  packageCredit: string | null;
  meetingUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
  patient: {
    id: string;
    firstNameEn: string;
    lastNameEn: string;
    firstNameAr?: string | null;
    lastNameAr?: string | null;
  };
  doctor: { id: string; name: string; nameAr?: string | null };
  room: { id: string; name: string; nameAr?: string | null } | null;
  service: { id: string; name: string; nameAr?: string | null; fee: string } | null;
  department?: { id: string; name: string; nameAr?: string | null } | null;
}

export interface AppointmentFilters {
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  departmentId?: string;
}

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  departmentId?: string;
  roomId?: string;
  serviceId?: string;
  scheduledAt: string;
  durationMins?: number;
  sessionType?: SessionType;
  notes?: string;
  feeOverride?: number;
  discount?: number;
  discountType?: DiscountType;
  discountReason?: string;
  discountCodeId?: string;
  meetingUrl?: string;
}

export interface UpdateAppointmentInput {
  doctorId?: string;
  departmentId?: string;
  roomId?: string;
  serviceId?: string;
  scheduledAt?: string;
  durationMins?: number;
  sessionType?: SessionType;
  status?: AppointmentStatus;
  cancelReason?: string;
  statusReason?: string;
  notes?: string;
  feeOverride?: number;
  discount?: number;
  discountType?: DiscountType;
  discountReason?: string;
  discountCodeId?: string | null;
  meetingUrl?: string;
}
