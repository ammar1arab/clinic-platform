import type { Translations } from '@/i18n';
import {
  packagesService,
  CreatePackageInput,
  UpdatePackageInput,
  ClinicPackage,
} from '@/services/packages.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { createCrudHooks } from '../query';

const {
  useList: usePackages,
  useCreate: useCreatePackage,
  useUpdate: useUpdatePackage,
  useDeactivate: useDeactivatePackage,
  useRemove: useDeletePackage,
} = createCrudHooks<ClinicPackage, CreatePackageInput, UpdatePackageInput>({
  keys: QUERY_KEYS.packages,
  entity: 'package',
  labels: (t: Translations) => ({ removed: t.common.packageDeleted }),
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
