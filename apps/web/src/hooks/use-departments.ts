import {
  departmentsService,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  Department,
} from '@/services/departments.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { createCrudHooks } from './create-crud-hooks';

const {
  useList: useDepartments,
  useCreate: useCreateDepartment,
  useUpdate: useUpdateDepartment,
  useRemove: useDeleteDepartment,
  useDeactivate: useDeactivateDepartment,
  useReactivate: useReactivateDepartment,
} = createCrudHooks<Department, CreateDepartmentInput, UpdateDepartmentInput>({
  keys: QUERY_KEYS.departments,
  entity: 'Department',
  labels: { removed: 'Department permanently deleted' },
  service: {
    getAll: departmentsService.getAll,
    create: departmentsService.create,
    update: departmentsService.update,
    remove: departmentsService.remove,
    deactivate: departmentsService.deactivate,
    reactivate: departmentsService.reactivate,
  },
});

export {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useDeactivateDepartment,
  useReactivateDepartment,
};
