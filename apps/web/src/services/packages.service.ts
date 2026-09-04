import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
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
    api
      .get<ClinicPackage[]>(ENDPOINTS.PACKAGES.BASE, { params: { clinicId } })
      .then((r) => r.data),

  create: (data: CreatePackageInput) =>
    api.post<ClinicPackage>(ENDPOINTS.PACKAGES.BASE, data).then((r) => r.data),

  update: (id: string, data: UpdatePackageInput) =>
    api
      .patch<ClinicPackage>(ENDPOINTS.PACKAGES.BY_ID(id), data)
      .then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(ENDPOINTS.PACKAGES.DEACTIVATE(id)).then((r) => r.data),

  remove: (id: string) =>
    api.delete(ENDPOINTS.PACKAGES.BY_ID(id)).then((r) => r.data),
};
