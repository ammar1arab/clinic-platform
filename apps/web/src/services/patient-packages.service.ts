import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  EnrollPatientPackageInput,
  PatientBillingSummary,
  PatientPackageDto,
} from "@clinic/types";

export type {
  EnrollPatientPackageInput,
  PatientBillingSummary,
  PatientPackageDto,
};

export const patientPackagesService = {
  getByPatient: (patientId: string) =>
    api
      .get<
        PatientPackageDto[]
      >(ENDPOINTS.PATIENT_PACKAGES.BASE, { params: { patientId } })
      .then((r) => r.data),

  getSummary: (patientId: string, excludeAppointmentId?: string) =>
    api
      .get<PatientBillingSummary>(
        ENDPOINTS.PATIENT_PACKAGES.SUMMARY(patientId),
        {
          params: excludeAppointmentId ? { excludeAppointmentId } : undefined,
        },
      )
      .then((r) => r.data),

  enroll: (data: EnrollPatientPackageInput) =>
    api
      .post<PatientPackageDto>(ENDPOINTS.PATIENT_PACKAGES.BASE, data)
      .then((r) => r.data),

  deactivate: (id: string) =>
    api
      .patch<PatientPackageDto>(ENDPOINTS.PATIENT_PACKAGES.DEACTIVATE(id))
      .then((r) => r.data),
};
