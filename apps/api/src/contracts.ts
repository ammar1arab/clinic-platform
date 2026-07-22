/**
 * Shared HTTP contracts — re-exported from @clinic/types.
 * Prisma remains the DB source of truth; keep packages/types aligned with API responses.
 */
export type {
  Role,
  SessionType,
  DiscountType,
  AppointmentStatus,
  CalendarView,
  ReportFormat,
  AuthMe,
  Clinic,
  ClinicSummary,
  PaymentMethodDto,
  PackageDto,
  DiscountCodeDto,
  Patient,
  PatientDetail,
  Appointment,
  ClinicStaffMember,
} from '@clinic/types';
