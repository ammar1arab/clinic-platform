import {
  patientPackagesService,
  EnrollPatientPackageInput,
  PatientPackageDto,
  PatientBillingSummary,
} from '@/services/patient-packages.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useFetchData, type TResponseError, useApiMutation, BILLING_OPTIONS, INVALIDATE } from '@/core/api/query';

export function usePatientBilling(
  patientId: string,
  enabled = true,
  excludeAppointmentId?: string,
) {
  return useFetchData<PatientBillingSummary>({
    queryKey: QUERY_KEYS.patientPackages.summary(patientId, excludeAppointmentId),
    request: () => patientPackagesService.getSummary(patientId, excludeAppointmentId),
    options: {
      ...BILLING_OPTIONS,
      enabled: enabled && !!patientId,
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
  return useApiMutation<PatientPackageDto, TResponseError, EnrollPatientPackageInput>({
    request: (data) => patientPackagesService.enroll(data),
    invalidateQueries: [...INVALIDATE.patientPackageWrite],
    successMessage: 'Package added',
  });
}

export function useDeactivatePatientPackage() {
  return useApiMutation<null, TResponseError, string>({
    request: async (id) => {
      await patientPackagesService.deactivate(id);
      return null;
    },
    invalidateQueries: [...INVALIDATE.patientPackageWrite],
    successMessage: 'Package removed',
  });
}