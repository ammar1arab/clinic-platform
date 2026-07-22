import { useQuery } from '@tanstack/react-query';
import { clinicsService } from '@/services/clinics.service';
import { QUERY_KEYS } from '@/constants/query-keys';

export function useClinicStaff(clinicId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.clinics.staff(clinicId),
    queryFn: () => clinicsService.getStaff(clinicId),
    enabled: !!clinicId,
  });
}
