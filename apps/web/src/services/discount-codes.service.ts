import { api } from "@/lib/api";
import type {
  CreateDiscountCodeInput,
  DiscountCodeDto,
  DiscountType,
  UpdateDiscountCodeInput,
  ValidatedDiscountCodeDto,
} from "@clinic/types";

export type DiscountCode = DiscountCodeDto;
export type ValidatedDiscountCode = ValidatedDiscountCodeDto;
export type { CreateDiscountCodeInput, DiscountType, UpdateDiscountCodeInput };

export const discountCodesService = {
  getAll: (clinicId: string) =>
    api
      .get<DiscountCode[]>("/discount-codes", { params: { clinicId } })
      .then((r) => r.data),

  create: (data: CreateDiscountCodeInput) =>
    api.post<DiscountCode>("/discount-codes", data).then((r) => r.data),

  update: (id: string, data: UpdateDiscountCodeInput) =>
    api.patch<DiscountCode>(`/discount-codes/${id}`, data).then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(`/discount-codes/${id}/deactivate`).then((r) => r.data),

  remove: (id: string) => api.delete(`/discount-codes/${id}`).then((r) => r.data),

  validate: (clinicId: string, code: string) =>
    api
      .post<ValidatedDiscountCode>("/discount-codes/validate", { clinicId, code })
      .then((r) => r.data),
};
