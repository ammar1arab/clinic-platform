import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
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
      .get<
        DiscountCode[]
      >(ENDPOINTS.DISCOUNT_CODES.BASE, { params: { clinicId } })
      .then((r) => r.data),

  create: (data: CreateDiscountCodeInput) =>
    api
      .post<DiscountCode>(ENDPOINTS.DISCOUNT_CODES.BASE, data)
      .then((r) => r.data),

  update: (id: string, data: UpdateDiscountCodeInput) =>
    api
      .patch<DiscountCode>(ENDPOINTS.DISCOUNT_CODES.BY_ID(id), data)
      .then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(ENDPOINTS.DISCOUNT_CODES.DEACTIVATE(id)).then((r) => r.data),

  remove: (id: string) =>
    api.delete(ENDPOINTS.DISCOUNT_CODES.BY_ID(id)).then((r) => r.data),

  validate: (clinicId: string, code: string) =>
    api
      .post<ValidatedDiscountCode>("/discount-codes/validate", {
        clinicId,
        code,
      })
      .then((r) => r.data),
};
