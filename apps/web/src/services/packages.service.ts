import { api } from "@/lib/api";
import type {
  CreatePackageInput,
  DiscountType,
  PackageDto,
  UpdatePackageInput,
} from "@clinic/types";

export type ClinicPackage = PackageDto;
export type { CreatePackageInput, DiscountType, UpdatePackageInput };

export const packagesService = {
  getAll: (clinicId: string) =>
    api.get<ClinicPackage[]>("/packages", { params: { clinicId } }).then((r) => r.data),

  create: (data: CreatePackageInput) =>
    api.post<ClinicPackage>("/packages", data).then((r) => r.data),

  update: (id: string, data: UpdatePackageInput) =>
    api.patch<ClinicPackage>(`/packages/${id}`, data).then((r) => r.data),

  deactivate: (id: string) => api.patch(`/packages/${id}/deactivate`).then((r) => r.data),

  remove: (id: string) => api.delete(`/packages/${id}`).then((r) => r.data),
};
