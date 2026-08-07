import { toast } from 'sonner';
import {
  patientPackagesService,
  EnrollPatientPackageInput,
  PatientPackageDto,
  PatientBillingSummary,
} from '@/services/patient-packages.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useFetchData } from './use-fetch-data';
import { useApiMutation } from './use-api-mutation';

export function usePatientBilling(
  patientId: string,
  enabled = true,
  excludeAppointmentId?: string,
) {
  return useFetchData<PatientBillingSummary>({
    queryKey: QUERY_KEYS.patientPackages.summary(patientId, excludeAppointmentId),
    request: () => patientPackagesService.getSummary(patientId, excludeAppointmentId),
    options: {
      enabled: enabled && !!patientId,
      staleTime: 30_000,
    },
  });
}

export function usePatientPackages(patientId: string) {
  return useFetchData<PatientPackageDto[]>({
    queryKey: QUERY_KEYS.patientPackages.list(patientId),
    request: () => patientPackagesService.getByPatient(patientId),
    options: {
      enabled: !!patientId,
    },
  });
}

export function useEnrollPatientPackage() {
  return useApiMutation<PatientPackageDto, unknown, EnrollPatientPackageInput>({
    request: (data) => patientPackagesService.enroll(data),
    invalidateQueries: [QUERY_KEYS.patientPackages.all],
    onSuccess: () => {
      toast.success('Package added');
    },
  });
}

export function useDeactivatePatientPackage() {
  return useApiMutation<unknown, unknown, string>({
    request: (id) => patientPackagesService.deactivate(id),
    invalidateQueries: [QUERY_KEYS.patientPackages.all],
    onSuccess: () => {
      toast.success('Package removed');
    },
  });
}
