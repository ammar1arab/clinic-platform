import { toast } from 'sonner';
import {
  patientsService,
  PatientFilters,
  CreatePatientInput,
  UpdatePatientInput,
  Patient,
  PatientDetail,
} from '@/services/patients.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useFetchData } from './use-fetch-data';
import { useApiMutation } from './use-api-mutation';

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

export function useCreatePatient(clinicId?: string) {
  void clinicId;
  return useApiMutation<PatientDetail, unknown, CreatePatientInput>({
    request: (data) => patientsService.create(data),
    invalidateQueries: [QUERY_KEYS.patients.all, QUERY_KEYS.patientPackages.all],
    onSuccess: () => {
      toast.success('Patient added');
    },
  });
}

export function useUpdatePatient(clinicId?: string) {
  void clinicId;
  return useApiMutation<PatientDetail, unknown, { id: string; data: UpdatePatientInput }>({
    request: ({ id, data }) => patientsService.update(id, data),
    invalidateQueries: [QUERY_KEYS.patients.all, QUERY_KEYS.patientPackages.all],
    onSuccess: () => {
      toast.success('Patient updated');
    },
  });
}

export function useTogglePatientStatus(clinicId?: string) {
  void clinicId;
  return useApiMutation<unknown, unknown, { id: string; isActive: boolean }>({
    request: ({ id, isActive }) =>
      isActive ? patientsService.reactivate(id) : patientsService.deactivate(id),
    invalidateQueries: [QUERY_KEYS.patients.all],
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'Patient reactivated' : 'Patient deactivated');
    },
  });
}

export function useDeletePatient(clinicId?: string) {
  void clinicId;
  return useApiMutation<unknown, unknown, string>({
    request: (id) => patientsService.remove(id),
    invalidateQueries: [QUERY_KEYS.patients.all],
    onSuccess: () => {
      toast.success('Patient deleted');
    },
  });
}
