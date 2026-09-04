import type { Translations } from '@/i18n';
import {
  paymentMethodsService,
  CreatePaymentMethodInput,
  UpdatePaymentMethodInput,
  PaymentMethod,
} from '@/services/payment-methods.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { createCrudHooks, useApiMutation, type TResponseError } from '../query';

const {
  useList: usePaymentMethods,
  useCreate: useCreatePaymentMethod,
  useUpdate: useUpdatePaymentMethod,
  useDeactivate: useDeactivatePaymentMethod,
  useRemove: useDeletePaymentMethod,
} = createCrudHooks<PaymentMethod, CreatePaymentMethodInput, UpdatePaymentMethodInput>({
  keys: QUERY_KEYS.paymentMethods,
  entity: 'paymentMethod',
  labels: (t: Translations) => ({ removed: t.common.paymentMethodDeleted }),
  service: {
    getAll: paymentMethodsService.getAll,
    create: paymentMethodsService.create,
    update: paymentMethodsService.update,
    deactivate: paymentMethodsService.deactivate,
    remove: paymentMethodsService.remove,
  },
});

export function useReorderPaymentMethods(clinicId: string) {
  return useApiMutation<PaymentMethod[], TResponseError, string[]>({
    request: (orderedIds) => paymentMethodsService.reorder(clinicId, orderedIds),
    invalidateQueries: [QUERY_KEYS.paymentMethods.list(clinicId)],
    successMessage: 'Order updated',
  });
}

export {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeactivatePaymentMethod,
  useDeletePaymentMethod,
};
