import {
  packagesService,
  CreatePackageInput,
  UpdatePackageInput,
  ClinicPackage,
} from '@/services/packages.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { createCrudHooks } from '@/core/api/query';

const {
  useList: usePackages,
  useCreate: useCreatePackage,
  useUpdate: useUpdatePackage,
  useDeactivate: useDeactivatePackage,
  useRemove: useDeletePackage,
} = createCrudHooks<ClinicPackage, CreatePackageInput, UpdatePackageInput>({
  keys: QUERY_KEYS.packages,
  entity: 'Package',
  labels: { removed: 'Package permanently deleted' },
  service: {
    getAll: packagesService.getAll,
    create: packagesService.create,
    update: packagesService.update,
    deactivate: packagesService.deactivate,
    remove: packagesService.remove,
  },
});

export {
  usePackages,
  useCreatePackage,
  useUpdatePackage,
  useDeactivatePackage,
  useDeletePackage,
};