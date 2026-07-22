import { api } from "@/lib/api";
import type {
  CreatePaymentMethodInput,
  PaymentMethodDto,
  UpdatePaymentMethodInput,
} from "@clinic/types";

export type PaymentMethod = PaymentMethodDto;
export type { CreatePaymentMethodInput, UpdatePaymentMethodInput };

export const paymentMethodsService = {
  getAll: (clinicId: string) =>
    api
      .get<PaymentMethod[]>("/payment-methods", { params: { clinicId } })
      .then((r) => r.data),

  create: (data: CreatePaymentMethodInput) =>
    api.post<PaymentMethod>("/payment-methods", data).then((r) => r.data),

  update: (id: string, data: UpdatePaymentMethodInput) =>
    api.patch<PaymentMethod>(`/payment-methods/${id}`, data).then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(`/payment-methods/${id}/deactivate`).then((r) => r.data),

  remove: (id: string) => api.delete(`/payment-methods/${id}`).then((r) => r.data),

  reorder: (clinicId: string, orderedIds: string[]) =>
    api
      .patch("/payment-methods/reorder", { orderedIds }, { params: { clinicId } })
      .then((r) => r.data),
};
