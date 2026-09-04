import {
  patientsService,
  PatientFilters,
  CreatePatientInput,
  UpdatePatientInput,
  Patient,
  PatientDetail,
} from '@/services/patients.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useFetchData, type TResponseError, useApiMutation, INVALIDATE } from '../query';
import { useLanguage } from '@/providers';

export function usePatients(filters: PatientFilters) {
  return useFetchData<Patient[]>({
    queryKey: QUERY_KEYS.patients.list(filters),
    request: () => patientsService.getAll(filters),
    options: {
      enabled: !!filters.clinicId,
    },
  });
}

export function usePatient(id: string) {
  return useFetchData<PatientDetail>({
    queryKey: QUERY_KEYS.patients.detail(id),
    request: () => patientsService.getOne(id),
    options: {
      enabled: !!id,
    },
  });
}

export function useCreatePatient(_clinicId?: string) {
  const { t } = useLanguage();
  return useApiMutation<PatientDetail, TResponseError, CreatePatientInput>({
    request: (data) => patientsService.create(data),
    invalidateQueries: [...INVALIDATE.patientWrite],
    successMessage: t.common.patientAdded,
  });
}

export function useUpdatePatient(_clinicId?: string) {
  const { t } = useLanguage();
  return useApiMutation<
    PatientDetail,
    TResponseError,
    { id: string; data: UpdatePatientInput }
  >({
    request: ({ id, data }) => patientsService.update(id, data),
    invalidateQueries: [...INVALIDATE.patientWrite],
    successMessage: t.common.patientUpdated,
  });
}

export function useTogglePatientStatus(_clinicId?: string) {
  const { t } = useLanguage();
  return useApiMutation<
    null,
    TResponseError,
    { id: string; isActive: boolean }
  >({
    request: async ({ id, isActive }) => {
      if (isActive) await patientsService.reactivate(id);
      else await patientsService.deactivate(id);
      return null;
    },
    invalidateQueries: [...INVALIDATE.patientStatus],
    successMessage: (_data, variables) =>
      variables.isActive
        ? t.common.patientReactivated
        : t.common.patientDeactivated,
  });
}

export function useDeletePatient(_clinicId?: string) {
  const { t } = useLanguage();
  return useApiMutation<null, TResponseError, string>({
    request: async (id) => {
      await patientsService.remove(id);
      return null;
    },
    invalidateQueries: [...INVALIDATE.patientStatus],
    successMessage: t.common.patientDeleted,
  });
}
