import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  CreateDepartmentInput,
  Department,
  UpdateDepartmentInput,
} from "@clinic/types";

export type { CreateDepartmentInput, Department, UpdateDepartmentInput };

export const departmentsService = {
  getAll: (clinicId: string) =>
    api
      .get<Department[]>(ENDPOINTS.DEPARTMENTS.BASE, { params: { clinicId } })
      .then((r) => r.data),

  getOne: (id: string) =>
    api.get<Department>(ENDPOINTS.DEPARTMENTS.BY_ID(id)).then((r) => r.data),

  create: (data: CreateDepartmentInput) =>
    api.post<Department>(ENDPOINTS.DEPARTMENTS.BASE, data).then((r) => r.data),

  update: (id: string, data: UpdateDepartmentInput) =>
    api
      .patch<Department>(ENDPOINTS.DEPARTMENTS.BY_ID(id), data)
      .then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(ENDPOINTS.DEPARTMENTS.DEACTIVATE(id)).then((r) => r.data),

  reactivate: (id: string) =>
    api.patch(ENDPOINTS.DEPARTMENTS.REACTIVATE(id)).then((r) => r.data),

  remove: (id: string) =>
    api.delete(ENDPOINTS.DEPARTMENTS.BY_ID(id)).then((r) => r.data),
};
