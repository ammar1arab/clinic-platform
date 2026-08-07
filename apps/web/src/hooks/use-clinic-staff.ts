import { clinicsService, ClinicStaffMember } from '@/services/clinics.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useFetchData } from './use-fetch-data';

export function useClinicStaff(clinicId: string) {
  return useFetchData<ClinicStaffMember[]>({
    queryKey: QUERY_KEYS.clinics.staff(clinicId),
    request: () => clinicsService.getStaff(clinicId),
    options: {
      enabled: !!clinicId,
    },
  });
}
