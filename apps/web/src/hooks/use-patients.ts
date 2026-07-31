import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  patientsService,
  PatientFilters,
  CreatePatientInput,
  UpdatePatientInput,
} from '@/services/patients.service';
import { QUERY_KEYS } from '@/constants/query-keys';

export function usePatients(filters: PatientFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.patients.list(filters),
    queryFn: () => patientsService.getAll(filters),
    enabled: !!filters.clinicId,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.patients.detail(id),
    queryFn: () => patientsService.getOne(id),
    enabled: !!id,
  });
}

export function useCreatePatient(_clinicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePatientInput) => patientsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients.all });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patientPackages.all });
      toast.success('Patient added');
    },
  });
}

export function useUpdatePatient(_clinicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePatientInput }) =>
      patientsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patientPackages.all });
      toast.success('Patient updated');
    },
  });
}

export function useTogglePatientStatus(_clinicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? patientsService.reactivate(id) : patientsService.deactivate(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients.detail(variables.id) });
      toast.success(variables.isActive ? 'Patient reactivated' : 'Patient deactivated');
    },
  });
}

export function useDeletePatient(_clinicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patientsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients.all });
      toast.success('Patient deleted');
    },
  });
}
