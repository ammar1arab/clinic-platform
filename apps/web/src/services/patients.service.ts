import { api } from '@/lib/api';
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
} from '@clinic/types';

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
  getAll: (filters: PatientFilters) =>
    api
      .get<Patient[]>('/patients', {
        params: {
          clinicId: filters.clinicId,
          search: filters.search || undefined,
          isActive: filters.isActive === undefined ? undefined : String(filters.isActive),
          gender: filters.gender || undefined,
          bloodType: filters.bloodType || undefined,
          primaryDoctorId: filters.primaryDoctorId || undefined,
          departmentId: filters.departmentId || undefined,
          visitFrom: filters.visitFrom || undefined,
          visitTo: filters.visitTo || undefined,
          dobFrom: filters.dobFrom || undefined,
          dobTo: filters.dobTo || undefined,
          sortBy: filters.sortBy || undefined,
          sortOrder: filters.sortOrder || undefined,
          page: filters.page || undefined,
          limit: filters.limit || undefined,
        },
      })
      .then((r) => r.data),

  getOne: (id: string) => api.get<PatientDetail>(`/patients/${id}`).then((r) => r.data),

  create: (data: CreatePatientInput) =>
    api.post<PatientDetail>('/patients', data).then((r) => r.data),

  update: (id: string, data: UpdatePatientInput) =>
    api.patch<PatientDetail>(`/patients/${id}`, data).then((r) => r.data),

  deactivate: (id: string) => api.patch(`/patients/${id}/deactivate`).then((r) => r.data),

  reactivate: (id: string) => api.patch(`/patients/${id}/reactivate`).then((r) => r.data),

  remove: (id: string) => api.delete(`/patients/${id}`).then((r) => r.data),
};
