import type { Translations } from '@/i18n';
import {
  servicesService,
  CreateServiceInput,
  UpdateServiceInput,
  ServiceItem,
} from '@/services/services.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { createCrudHooks } from '../query';

const {
  useList: useServices,
  useCreate: useCreateService,
  useUpdate: useUpdateService,
  useRemove: useDeleteService,
  useDeactivate: useDeactivateService,
  useReactivate: useReactivateService,
} = createCrudHooks<ServiceItem, CreateServiceInput, UpdateServiceInput>({
  keys: QUERY_KEYS.services,
  entity: 'service',
  labels: (t: Translations) => ({ removed: t.common.serviceDeleted }),
  service: {
    getAll: servicesService.getAll,
    create: servicesService.create,
    update: servicesService.update,
    remove: servicesService.remove,
    deactivate: servicesService.deactivate,
    reactivate: servicesService.reactivate,
  },
});

export {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useDeactivateService,
  useReactivateService,
};
