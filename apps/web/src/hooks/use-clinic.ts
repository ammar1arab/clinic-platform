import { toast } from 'sonner';
import { clinicsService, UpdateClinicInput, Clinic } from '@/services/clinics.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useFetchData } from './use-fetch-data';
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
  return useApiMutation<Clinic, unknown, UpdateClinicInput>({
    request: (data: UpdateClinicInput) => clinicsService.update(clinicId, data),
    invalidateQueries: [QUERY_KEYS.clinics.detail(clinicId)],
    onSuccess: () => {
      toast.success('Clinic settings saved');
    },
  });
}
