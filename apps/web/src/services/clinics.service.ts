import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  Clinic,
  ClinicStaffMember,
  UpdateClinicInput,
} from "@clinic/types";

export type { Clinic, ClinicStaffMember, UpdateClinicInput };

export const clinicsService = {
  getOne: (id: string) =>
    api.get<Clinic>(ENDPOINTS.CLINICS.BY_ID(id)).then((r) => r.data),

  update: (id: string, data: UpdateClinicInput) =>
    api.patch<Clinic>(ENDPOINTS.CLINICS.BY_ID(id), data).then((r) => r.data),

  getStaff: (clinicId: string) =>
    api
      .get<ClinicStaffMember[]>(ENDPOINTS.CLINICS.STAFF(clinicId))
      .then((r) => r.data),
};
