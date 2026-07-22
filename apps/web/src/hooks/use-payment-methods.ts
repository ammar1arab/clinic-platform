import {
  paymentMethodsService,
  CreatePaymentMethodInput,
  UpdatePaymentMethodInput,
  PaymentMethod,
} from '@/services/payment-methods.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { createCrudHooks } from './create-crud-hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      paymentMethodsService.reorder(clinicId, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.paymentMethods.list(clinicId) });
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
