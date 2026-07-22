import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { clinicsService, UpdateClinicInput } from '@/services/clinics.service';
import { QUERY_KEYS } from '@/constants/query-keys';

export function useClinic(clinicId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.clinics.detail(clinicId),
    queryFn: () => clinicsService.getOne(clinicId),
    enabled: !!clinicId,
  });
}

export function useUpdateClinic(clinicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateClinicInput) => clinicsService.update(clinicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clinics.detail(clinicId) });
      toast.success('Clinic settings saved');
    },
  });
}
