import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
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
      .get<
        PaymentMethod[]
      >(ENDPOINTS.PAYMENT_METHODS.BASE, { params: { clinicId } })
      .then((r) => r.data),

  create: (data: CreatePaymentMethodInput) =>
    api
      .post<PaymentMethod>(ENDPOINTS.PAYMENT_METHODS.BASE, data)
      .then((r) => r.data),

  update: (id: string, data: UpdatePaymentMethodInput) =>
    api
      .patch<PaymentMethod>(ENDPOINTS.PAYMENT_METHODS.BY_ID(id), data)
      .then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(ENDPOINTS.PAYMENT_METHODS.DEACTIVATE(id)).then((r) => r.data),

  remove: (id: string) =>
    api.delete(ENDPOINTS.PAYMENT_METHODS.BY_ID(id)).then((r) => r.data),

  reorder: (clinicId: string, orderedIds: string[]) =>
    api
      .patch(
        ENDPOINTS.PAYMENT_METHODS.REORDER,
        { orderedIds },
        { params: { clinicId } },
      )
      .then((r) => r.data),
};
