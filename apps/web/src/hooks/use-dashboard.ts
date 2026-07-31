import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useClinicRealtime, type ClinicRealtimeOptions } from './use-clinic-realtime';

export function useDashboardKpis(clinicId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.kpis(clinicId),
    queryFn: () => dashboardService.getKpis(clinicId),
    enabled: !!clinicId,

    refetchInterval: 60_000,
  });
}

export function useRoomUtilization(clinicId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.roomUtilization(clinicId),
    queryFn: () => dashboardService.getRoomUtilization(clinicId),
    enabled: !!clinicId,
    refetchInterval: 60_000,
  });
}


export function useDashboardRealtime(
  clinicId: string,
  options?: ClinicRealtimeOptions,
) {
  return useClinicRealtime(clinicId, options);
}
