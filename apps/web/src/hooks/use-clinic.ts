import { clinicsService, UpdateClinicInput, Clinic } from '@/services/clinics.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useFetchData, type TResponseError } from './use-fetch-data';
import { useApiMutation } from './use-api-mutation';

export function useClinic(clinicId: string) {
  return useFetchData<Clinic>({
    queryKey: QUERY_KEYS.clinics.detail(clinicId),
    request: () => clinicsService.getOne(clinicId),
    options: {
      enabled: !!clinicId,
    },
  });
}

export function useUpdateClinic(clinicId: string) {
  return useApiMutation<Clinic, TResponseError, UpdateClinicInput>({
    request: (data) => clinicsService.update(clinicId, data),
    invalidateQueries: [QUERY_KEYS.clinics.detail(clinicId)],
    successMessage: 'Clinic settings saved',
  });
}
