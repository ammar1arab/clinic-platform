import { DEFAULT_DURATION_MINS } from '@/constants/appointment';
import { toDateParam, toTimeParam } from '@/lib/datetime';
import { formatClinicAmount } from '@/lib/package-balance';
import type { AppointmentFormData } from '@/lib/validations';
import type {
  Appointment,
  CreateAppointmentInput,
  DiscountType,
  UpdateAppointmentInput,
} from '@/services/appointments.service';
import type { DiscountCode, ValidatedDiscountCode } from '@/services/discount-codes.service';
import type { ClinicPackage } from '@/services/packages.service';
import type { Patient } from '@/services/patients.service';
import { computePayable } from '@/services/appointments.service';

export function emptyAppointmentValues(
  defaults: { date?: string; time?: string; doctorId?: string } = {},
): AppointmentFormData {
  return {
    patientId: '',
    doctorId: defaults.doctorId ?? '',
    departmentId: '',
    roomId: '',
    serviceId: '',
    date: defaults.date ?? '',
    time: defaults.time ?? '',
    durationMins: DEFAULT_DURATION_MINS,
    sessionType: 'in_person',
    meetingUrl: '',
    feeOverride: '',
    discount: '',
    discountType: 'fixed',
    discountReason: '',
    notes: '',
  };
}

export function toAppointmentFormValues(appt: Appointment): AppointmentFormData {
  const dt = new Date(appt.scheduledAt);
  return {
    patientId: appt.patientId,
    doctorId: appt.doctorId,
    departmentId: appt.departmentId ?? '',
    roomId: appt.roomId ?? '',
    serviceId: appt.serviceId ?? '',
    date: toDateParam(dt),
    time: toTimeParam(dt),
    durationMins: String(appt.durationMins),
    sessionType: appt.sessionType,
    meetingUrl: appt.meetingUrl ?? '',
    feeOverride: appt.fee != null ? String(Number(appt.fee)) : '',
    discount:
      appt.discount != null && Number(appt.discount) > 0 ? String(Number(appt.discount)) : '',
    discountType: appt.discountType ?? 'fixed',
    discountReason: appt.discountReason ?? '',
    notes: appt.notes ?? '',
  };
}

export function hasDiscountValue(discount: string) {
  return !!discount.trim() && Number(discount) > 0;
}

export function resolveBaseFee(
  feeOverride: string,
  serviceFee: string | number | null | undefined,
) {
  if (feeOverride.trim()) return Number(feeOverride);
  return serviceFee != null ? Number(serviceFee) : 0;
}

export function resolvePricing(baseFee: number, discount: string, discountType: DiscountType) {
  return computePayable(baseFee, discount.trim() ? Number(discount) : 0, discountType);
}

export function discountExceedsFee(
  discount: string,
  discountType: DiscountType,
  baseFee: number,
) {
  return (
    discountType === 'fixed' &&
    !!discount.trim() &&
    Number(discount) > baseFee &&
    baseFee > 0
  );
}

function sharedWriteFields(data: AppointmentFormData): CreateAppointmentInput {
  return {
    patientId: data.patientId,
    doctorId: data.doctorId,
    departmentId: data.departmentId || undefined,
    roomId: data.sessionType === 'in_person' ? data.roomId || undefined : undefined,
    serviceId: data.serviceId || undefined,
    scheduledAt: new Date(`${data.date}T${data.time}:00`).toISOString(),
    durationMins: Number(data.durationMins),
    sessionType: data.sessionType,
    meetingUrl: data.sessionType === 'online' ? data.meetingUrl.trim() : undefined,
    notes: data.notes.trim() || undefined,
    feeOverride: data.feeOverride.trim() ? Number(data.feeOverride) : undefined,
  };
}

function discountFields(data: AppointmentFormData, appliedCodeId: string | null) {
  if (!hasDiscountValue(data.discount)) return null;
  return {
    discount: Number(data.discount),
    discountType: data.discountType,
    discountReason: data.discountReason.trim(),
    discountCodeId: appliedCodeId ?? undefined,
  };
}

export function toCreateAppointmentInput(
  data: AppointmentFormData,
  appliedCodeId: string | null,
): CreateAppointmentInput {
  return { ...sharedWriteFields(data), ...discountFields(data, appliedCodeId) };
}

export function toUpdateAppointmentInput(
  data: AppointmentFormData,
  appliedCodeId: string | null,
  extra: Pick<UpdateAppointmentInput, 'status' | 'cancelReason'>,
): UpdateAppointmentInput {
  const { patientId: _patientId, ...shared } = sharedWriteFields(data);
  const discount = discountFields(data, appliedCodeId);
  return {
    ...shared,
    ...extra,
    discount: discount?.discount ?? 0,
    discountType: data.discountType,
    discountReason: discount?.discountReason,
    discountCodeId: appliedCodeId,
  };
}

export type AppliedDiscount = {
  discount: string;
  discountType: DiscountType;
  discountReason: string;
  appliedCodeId?: string | null;
  promoCode?: string;
};

export function discountFromPackage(pkg: ClinicPackage): AppliedDiscount | null {
  if (!pkg.discountType || pkg.discountValue == null || Number(pkg.discountValue) <= 0) {
    return null;
  }
  return {
    discount: String(Number(pkg.discountValue)),
    discountType: pkg.discountType,
    discountReason: `Package: ${pkg.name}`,
  };
}

export function discountFromCode(
  code: Pick<DiscountCode | ValidatedDiscountCode, 'id' | 'code' | 'discountValue' | 'discountType'>,
): AppliedDiscount {
  return {
    discount: String(Number(code.discountValue)),
    discountType: code.discountType,
    discountReason: `Code: ${code.code}`,
    appliedCodeId: code.id,
    promoCode: code.code,
  };
}

export function billingDefaultsForPatient(
  patient: Patient | undefined,
  packages: ClinicPackage[] | undefined,
  codes: DiscountCode[] | undefined,
): AppliedDiscount | null {
  if (!patient) return null;

  const pkg = packages?.find((p) => p.id === patient.packageId);
  const fromPkg = pkg ? discountFromPackage(pkg) : null;

  const code = codes?.find((c) => c.id === patient.discountCodeId && c.isActive);
  if (code) return discountFromCode(code);
  return fromPkg;
}

export function paymentStatusMeta(appt: Appointment) {
  if (appt.isPaid && appt.patientPackageId) {
    return {
      variant: 'info' as const,
      label: 'Paid · Package',
      detail: appt.paymentMethod ? `Package (${appt.paymentMethod})` : 'Package',
    };
  }
  if (appt.isPaid) {
    const method = appt.paymentMethodRef?.name ?? appt.paymentMethod;
    return {
      variant: 'success' as const,
      label: 'Paid',
      detail: method || 'No method recorded',
    };
  }
  return {
    variant: appt.patientPackageId ? ('info' as const) : ('warning' as const),
    label: 'Unpaid',
    detail: 'Select a method, then mark as paid',
  };
}

export function packageCreditLabel(credit: string | number | null | undefined) {
  return credit != null ? `${formatClinicAmount(credit)} credit used` : '1 session used';
}

export function staffRoleLabel(role: string | null | undefined) {
  return role ? ` · ${role.replace(/_/g, ' ')}` : '';
}
