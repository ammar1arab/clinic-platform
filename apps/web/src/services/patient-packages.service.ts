import { api } from "@/lib/api";
import type {
  EnrollPatientPackageInput,
  PatientBillingSummary,
  PatientPackageDto,
} from "@clinic/types";

export type { EnrollPatientPackageInput, PatientBillingSummary, PatientPackageDto };

export const patientPackagesService = {
  getByPatient: (patientId: string) =>
    api
      .get<PatientPackageDto[]>("/patient-packages", { params: { patientId } })
      .then((r) => r.data),

  getSummary: (patientId: string, excludeAppointmentId?: string) =>
    api
      .get<PatientBillingSummary>(`/patient-packages/summary/${patientId}`, {
        params: excludeAppointmentId ? { excludeAppointmentId } : undefined,
      })
      .then((r) => r.data),

  enroll: (data: EnrollPatientPackageInput) =>
    api.post<PatientPackageDto>("/patient-packages", data).then((r) => r.data),

  deactivate: (id: string) =>
    api.patch<PatientPackageDto>(`/patient-packages/${id}/deactivate`).then((r) => r.data),
};
