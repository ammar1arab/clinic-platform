import type { Translations } from '@/i18n';
import {
  discountCodesService,
  CreateDiscountCodeInput,
  UpdateDiscountCodeInput,
  DiscountCode,
  ValidatedDiscountCode,
} from '@/services/discount-codes.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { createCrudHooks, useApiMutation, type TResponseError } from '../query';
import { useLanguage } from '@/providers';

const {
  useList: useDiscountCodes,
  useCreate: useCreateDiscountCode,
  useUpdate: useUpdateDiscountCode,
  useDeactivate: useDeactivateDiscountCode,
  useRemove: useDeleteDiscountCode,
} = createCrudHooks<DiscountCode, CreateDiscountCodeInput, UpdateDiscountCodeInput>({
  keys: QUERY_KEYS.discountCodes,
  entity: 'promocode',
  labels: (t: Translations) => ({ removed: t.common.promocodeDeleted }),
  service: {
    getAll: discountCodesService.getAll,
    create: discountCodesService.create,
    update: discountCodesService.update,
    deactivate: discountCodesService.deactivate,
    remove: discountCodesService.remove,
  },
});

export function useValidateDiscountCode(clinicId: string) {
  const { t } = useLanguage();
  return useApiMutation<ValidatedDiscountCode, TResponseError, string>({
    request: (code) => discountCodesService.validate(clinicId, code),
    errorMessage: t.common.invalidPromocode,
  });
}

export {
  useDiscountCodes,
  useCreateDiscountCode,
  useUpdateDiscountCode,
  useDeactivateDiscountCode,
  useDeleteDiscountCode,
};
