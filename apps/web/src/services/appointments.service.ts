import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
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
  getAll: (filters: AppointmentFilters) => {
    const params: Record<string, string | number | boolean | undefined> = {
      ...filters,
    };
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === "") {
        delete params[key];
      }
    });
    return api
      .get<Appointment[]>(ENDPOINTS.APPOINTMENTS.BASE, { params })
      .then((r) => r.data);
  },

  getOne: (id: string) =>
    api.get<Appointment>(ENDPOINTS.APPOINTMENTS.BY_ID(id)).then((r) => r.data),

  create: (data: CreateAppointmentInput) =>
    api
      .post<Appointment>(ENDPOINTS.APPOINTMENTS.BASE, data)
      .then((r) => r.data),

  update: (id: string, data: UpdateAppointmentInput) =>
    api
      .patch<Appointment>(ENDPOINTS.APPOINTMENTS.BY_ID(id), data)
      .then((r) => r.data),

  markPaid: (id: string, paymentMethodId: string) =>
    api
      .patch<Appointment>(ENDPOINTS.APPOINTMENTS.MARK_PAID(id), {
        paymentMethodId,
      })
      .then((r) => r.data),

  markUnpaid: (id: string) =>
    api
      .patch<Appointment>(ENDPOINTS.APPOINTMENTS.MARK_UNPAID(id))
      .then((r) => r.data),

  redeemPackage: (id: string, patientPackageId: string) =>
    api
      .patch<Appointment>(ENDPOINTS.APPOINTMENTS.REDEEM_PACKAGE(id), {
        patientPackageId,
      })
      .then((r) => r.data),

  releasePackage: (id: string) =>
    api
      .patch<Appointment>(ENDPOINTS.APPOINTMENTS.RELEASE_PACKAGE(id))
      .then((r) => r.data),
};
