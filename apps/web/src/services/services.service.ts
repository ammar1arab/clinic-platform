import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  CreateServiceInput,
  ServiceItem,
  ServiceSessionMode,
  UpdateServiceInput,
} from "@clinic/types";

export type {
  CreateServiceInput,
  ServiceItem,
  ServiceSessionMode,
  UpdateServiceInput,
};

export const servicesService = {
  getAll: (clinicId: string) =>
    api
      .get<ServiceItem[]>(ENDPOINTS.SERVICES.BASE, { params: { clinicId } })
      .then((r) => r.data),

  getOne: (id: string) =>
    api.get<ServiceItem>(ENDPOINTS.SERVICES.BY_ID(id)).then((r) => r.data),

  create: (data: CreateServiceInput) =>
    api.post<ServiceItem>(ENDPOINTS.SERVICES.BASE, data).then((r) => r.data),

  update: (id: string, data: UpdateServiceInput) =>
    api
      .patch<ServiceItem>(ENDPOINTS.SERVICES.BY_ID(id), data)
      .then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(ENDPOINTS.SERVICES.DEACTIVATE(id)).then((r) => r.data),

  reactivate: (id: string) =>
    api.patch(ENDPOINTS.SERVICES.REACTIVATE(id)).then((r) => r.data),

  remove: (id: string) =>
    api.delete(ENDPOINTS.SERVICES.BY_ID(id)).then((r) => r.data),
};
