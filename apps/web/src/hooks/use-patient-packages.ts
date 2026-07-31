import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  patientPackagesService,
  EnrollPatientPackageInput,
} from '@/services/patient-packages.service';
import { QUERY_KEYS } from '@/constants/query-keys';

export function usePatientBilling(
  patientId: string,
  enabled = true,
  excludeAppointmentId?: string,
) {
  return useQuery({
    queryKey: QUERY_KEYS.patientPackages.summary(patientId, excludeAppointmentId),
    queryFn: () => patientPackagesService.getSummary(patientId, excludeAppointmentId),
    enabled: enabled && !!patientId,
    staleTime: 30_000,
  });
}

export function usePatientPackages(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.patientPackages.list(patientId),
    queryFn: () => patientPackagesService.getByPatient(patientId),
    enabled: !!patientId,
  });
}

export function useEnrollPatientPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EnrollPatientPackageInput) => patientPackagesService.enroll(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patientPackages.all });
      toast.success('Package added');
    },
  });
}

export function useDeactivatePatientPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patientPackagesService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patientPackages.all });
      toast.success('Package removed');
    },
  });
}
