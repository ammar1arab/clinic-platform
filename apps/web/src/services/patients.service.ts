import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  CreatePatientInput,
  Patient,
  PatientDetail,
  PatientDiscountCodeSummary,
  PatientFilters,
  PatientPackageSummary,
  PatientSortBy,
  SortOrder,
  UpdatePatientInput,
} from "@clinic/types";

export type {
  CreatePatientInput,
  Patient,
  PatientDetail,
  PatientDiscountCodeSummary,
  PatientFilters,
  PatientPackageSummary,
  PatientSortBy,
  SortOrder,
  UpdatePatientInput,
};

export const patientsService = {
  getAll: (filters: PatientFilters) => {
    const params: Record<string, string | number | boolean | undefined> = {
      ...filters,
    };
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === "") {
        delete params[key];
      }
    });
    if (params.isActive !== undefined) {
      params.isActive = String(params.isActive);
    }

    return api
      .get<Patient[]>(ENDPOINTS.PATIENTS.BASE, { params })
      .then((r) => r.data);
  },

  getOne: (id: string) =>
    api.get<PatientDetail>(ENDPOINTS.PATIENTS.BY_ID(id)).then((r) => r.data),

  create: (data: CreatePatientInput) =>
    api.post<PatientDetail>(ENDPOINTS.PATIENTS.BASE, data).then((r) => r.data),

  update: (id: string, data: UpdatePatientInput) =>
    api
      .patch<PatientDetail>(ENDPOINTS.PATIENTS.BY_ID(id), data)
      .then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(ENDPOINTS.PATIENTS.DEACTIVATE(id)).then((r) => r.data),

  reactivate: (id: string) =>
    api.patch(ENDPOINTS.PATIENTS.REACTIVATE(id)).then((r) => r.data),

  remove: (id: string) =>
    api.delete(ENDPOINTS.PATIENTS.BY_ID(id)).then((r) => r.data),
};
