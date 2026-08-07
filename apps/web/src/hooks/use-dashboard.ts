import { dashboardService, DashboardKpis, RoomUtilization } from '@/services/dashboard.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useClinicRealtime, type ClinicRealtimeOptions } from './use-clinic-realtime';
import { useFetchData } from './use-fetch-data';

export function useDashboardKpis(clinicId: string) {
  return useFetchData<DashboardKpis>({
    queryKey: QUERY_KEYS.dashboard.kpis(clinicId),
    request: () => dashboardService.getKpis(clinicId),
    options: {
      enabled: !!clinicId,
      staleTime: 60_000,
    },
  });
}

export function useRoomUtilization(clinicId: string) {
  return useFetchData<RoomUtilization[]>({
    queryKey: QUERY_KEYS.dashboard.roomUtilization(clinicId),
    request: () => dashboardService.getRoomUtilization(clinicId),
    options: {
      enabled: !!clinicId,
      staleTime: 60_000,
    },
  });
}

export function useDashboardRealtime(
  clinicId: string,
  options?: ClinicRealtimeOptions,
) {
  return useClinicRealtime(clinicId, options);
}
