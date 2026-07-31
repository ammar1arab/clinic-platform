import { api } from "@/lib/api";
import type {
  Appointment,
  AppointmentFilters,
  AppointmentStatus,
  CreateAppointmentInput,
  DiscountType,
  SessionType,
  UpdateAppointmentInput,
} from "@clinic/types";

export type {
  Appointment,
  AppointmentFilters,
  AppointmentStatus,
  CreateAppointmentInput,
  DiscountType,
  SessionType,
  UpdateAppointmentInput,
};

export function computePayable(
  fee: string | number | null | undefined,
  discount: string | number | null | undefined,
  discountType: DiscountType | null | undefined,
): { fee: number; discountAmount: number; payable: number } {
  const baseFee = Number(fee ?? 0) || 0;
  const rawDiscount = Number(discount ?? 0) || 0;

  let discountAmount = 0;
  if (rawDiscount > 0 && discountType) {
    discountAmount =
      discountType === "percentage"
        ? (baseFee * Math.min(rawDiscount, 100)) / 100
        : Math.min(rawDiscount, baseFee);
  }

  return {
    fee: baseFee,
    discountAmount,
    payable: Math.max(baseFee - discountAmount, 0),
  };
}

export const appointmentsService = {
  getAll: (filters: AppointmentFilters) =>
    api
      .get<Appointment[]>("/appointments", {
        params: {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          doctorId: filters.doctorId || undefined,
          departmentId: filters.departmentId || undefined,
        },
      })
      .then((r) => r.data),

  getOne: (id: string) =>
    api.get<Appointment>(`/appointments/${id}`).then((r) => r.data),

  create: (data: CreateAppointmentInput) =>
    api.post<Appointment>("/appointments", data).then((r) => r.data),

  update: (id: string, data: UpdateAppointmentInput) =>
    api.patch<Appointment>(`/appointments/${id}`, data).then((r) => r.data),

  markPaid: (id: string, paymentMethodId: string) =>
    api
      .patch<Appointment>(`/appointments/${id}/mark-paid`, { paymentMethodId })
      .then((r) => r.data),

  markUnpaid: (id: string) =>
    api.patch<Appointment>(`/appointments/${id}/mark-unpaid`).then((r) => r.data),

  redeemPackage: (id: string, patientPackageId: string) =>
    api
      .patch<Appointment>(`/appointments/${id}/redeem-package`, { patientPackageId })
      .then((r) => r.data),

  releasePackage: (id: string) =>
    api.patch<Appointment>(`/appointments/${id}/release-package`).then((r) => r.data),
};
