import { api } from '@/lib/api';
import type {
  CreateDepartmentInput,
  Department,
  UpdateDepartmentInput,
} from '@clinic/types';

export type { CreateDepartmentInput, Department, UpdateDepartmentInput };

export const departmentsService = {
  getAll: (clinicId: string) =>
    api.get<Department[]>('/departments', { params: { clinicId } }).then((r) => r.data),

  getOne: (id: string) =>
    api.get<Department>(`/departments/${id}`).then((r) => r.data),

  create: (data: CreateDepartmentInput) =>
    api.post<Department>('/departments', data).then((r) => r.data),

  update: (id: string, data: UpdateDepartmentInput) =>
    api.patch<Department>(`/departments/${id}`, data).then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(`/departments/${id}/deactivate`).then((r) => r.data),

  reactivate: (id: string) =>
    api.patch(`/departments/${id}/reactivate`).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/departments/${id}`).then((r) => r.data),
};
