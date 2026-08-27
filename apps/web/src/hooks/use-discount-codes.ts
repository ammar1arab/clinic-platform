import {
  discountCodesService,
  CreateDiscountCodeInput,
  UpdateDiscountCodeInput,
  DiscountCode,
  ValidatedDiscountCode,
} from '@/services/discount-codes.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import {
  createCrudHooks,
  useApiMutation,
  type TResponseError,
} from '@/core/api/query';

const {
  useList: useDiscountCodes,
  useCreate: useCreateDiscountCode,
  useUpdate: useUpdateDiscountCode,
  useDeactivate: useDeactivateDiscountCode,
  useRemove: useDeleteDiscountCode,
} = createCrudHooks<DiscountCode, CreateDiscountCodeInput, UpdateDiscountCodeInput>({
  keys: QUERY_KEYS.discountCodes,
  entity: 'Promocode',
  labels: { removed: 'Promocode permanently deleted' },
  service: {
    getAll: discountCodesService.getAll,
    create: discountCodesService.create,
    update: discountCodesService.update,
    deactivate: discountCodesService.deactivate,
    remove: discountCodesService.remove,
  },
});

export function useValidateDiscountCode(clinicId: string) {
  return useApiMutation<ValidatedDiscountCode, TResponseError, string>({
    request: (code) => discountCodesService.validate(clinicId, code),
    errorMessage: 'Invalid promocode',
  });
}

export {
  useDiscountCodes,
  useCreateDiscountCode,
  useUpdateDiscountCode,
  useDeactivateDiscountCode,
  useDeleteDiscountCode,
};