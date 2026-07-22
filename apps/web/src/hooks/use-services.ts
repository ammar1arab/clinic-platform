import {
  servicesService,
  CreateServiceInput,
  UpdateServiceInput,
  ServiceItem,
} from '@/services/services.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { createCrudHooks } from './create-crud-hooks';

const {
  useList: useServices,
  useCreate: useCreateService,
  useUpdate: useUpdateService,
  useRemove: useDeleteService,
  useDeactivate: useDeactivateService,
  useReactivate: useReactivateService,
} = createCrudHooks<ServiceItem, CreateServiceInput, UpdateServiceInput>({
  keys: QUERY_KEYS.services,
  entity: 'Service',
  labels: {
    removed: 'Service permanently deleted',
  },
  service: servicesService,
});

export {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useDeactivateService,
  useReactivateService,
};
