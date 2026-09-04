import {
  patientPackagesService,
  EnrollPatientPackageInput,
  PatientPackageDto,
  PatientBillingSummary,
} from '@/services/patient-packages.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useFetchData, type TResponseError, useApiMutation, BILLING_OPTIONS, INVALIDATE } from '../query';
import { useLanguage } from '@/providers';

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
  const { t } = useLanguage();
  return useApiMutation<PatientPackageDto, TResponseError, EnrollPatientPackageInput>({
    request: (data) => patientPackagesService.enroll(data),
    invalidateQueries: [...INVALIDATE.patientPackageWrite],
    successMessage: t.common.packageAdded,
  });
}

export function useDeactivatePatientPackage() {
  const { t } = useLanguage();
  return useApiMutation<null, TResponseError, string>({
    request: async (id) => {
      await patientPackagesService.deactivate(id);
      return null;
    },
    invalidateQueries: [...INVALIDATE.patientPackageWrite],
    successMessage: t.common.packageRemoved,
  });
}
