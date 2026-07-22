import { api } from "@/lib/api";
import type {
  Clinic,
  ClinicStaffMember,
  UpdateClinicInput,
} from "@clinic/types";

export type { Clinic, ClinicStaffMember, UpdateClinicInput };

export const clinicsService = {
  getOne: (id: string) => api.get<Clinic>(`/clinics/${id}`).then((r) => r.data),

  update: (id: string, data: UpdateClinicInput) =>
    api.patch<Clinic>(`/clinics/${id}`, data).then((r) => r.data),

  getStaff: (clinicId: string) =>
    api.get<ClinicStaffMember[]>(`/clinics/${clinicId}/staff`).then((r) => r.data),
};
