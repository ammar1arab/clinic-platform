import {
  paymentMethodsService,
  CreatePaymentMethodInput,
  UpdatePaymentMethodInput,
  PaymentMethod,
} from '@/services/payment-methods.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { createCrudHooks } from './create-crud-hooks';
import { useApiMutation } from './use-api-mutation';
import { toast } from 'sonner';

const {
  useList: usePaymentMethods,
  useCreate: useCreatePaymentMethod,
  useUpdate: useUpdatePaymentMethod,
  useDeactivate: useDeactivatePaymentMethod,
  useRemove: useDeletePaymentMethod,
} = createCrudHooks<PaymentMethod, CreatePaymentMethodInput, UpdatePaymentMethodInput>({
  keys: QUERY_KEYS.paymentMethods,
  entity: 'Payment method',
  labels: { removed: 'Payment method permanently deleted' },
  service: {
    getAll: paymentMethodsService.getAll,
    create: paymentMethodsService.create,
    update: paymentMethodsService.update,
    deactivate: paymentMethodsService.deactivate,
    remove: paymentMethodsService.remove,
  },
});

export function useReorderPaymentMethods(clinicId: string) {
  return useApiMutation<PaymentMethod[], unknown, string[]>({
    request: (orderedIds: string[]) =>
      paymentMethodsService.reorder(clinicId, orderedIds),
    invalidateQueries: [QUERY_KEYS.paymentMethods.list(clinicId)],
    onSuccess: () => {
      toast.success('Order updated');
    },
  });
}

export {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeactivatePaymentMethod,
  useDeletePaymentMethod,
};
