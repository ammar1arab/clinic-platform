import { api } from '@/lib/api';
import type {
  CreateServiceInput,
  ServiceItem,
  ServiceSessionMode,
  UpdateServiceInput,
} from '@clinic/types';

export type {
  CreateServiceInput,
  ServiceItem,
  ServiceSessionMode,
  UpdateServiceInput,
};

export const servicesService = {
  getAll: (clinicId: string) =>
    api.get<ServiceItem[]>('/services', { params: { clinicId } }).then((r) => r.data),

  getOne: (id: string) =>
    api.get<ServiceItem>(`/services/${id}`).then((r) => r.data),

  create: (data: CreateServiceInput) =>
    api.post<ServiceItem>('/services', data).then((r) => r.data),

  update: (id: string, data: UpdateServiceInput) =>
    api.patch<ServiceItem>(`/services/${id}`, data).then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(`/services/${id}/deactivate`).then((r) => r.data),

  reactivate: (id: string) =>
    api.patch(`/services/${id}/reactivate`).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/services/${id}`).then((r) => r.data),
};
