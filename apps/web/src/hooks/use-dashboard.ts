import { dashboardService, DashboardKpis, RoomUtilization } from '@/services/dashboard.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useClinicRealtime, type ClinicRealtimeOptions } from './use-clinic-realtime';
import { useFetchData } from './use-fetch-data';
import { clinicListOptions, DASHBOARD_OPTIONS } from './query-presets';

export function useDashboardKpis(clinicId: string) {
  return useFetchData<DashboardKpis>({
    queryKey: QUERY_KEYS.dashboard.kpis(clinicId),
    request: () => dashboardService.getKpis(clinicId),
    options: {
      ...clinicListOptions(clinicId),
      ...DASHBOARD_OPTIONS,
    },
  });
}

export function useRoomUtilization(clinicId: string) {
  return useFetchData<RoomUtilization[]>({
    queryKey: QUERY_KEYS.dashboard.roomUtilization(clinicId),
    request: () => dashboardService.getRoomUtilization(clinicId),
    options: {
      ...clinicListOptions(clinicId),
      ...DASHBOARD_OPTIONS,
    },
  });
}

export function useDashboardRealtime(
  clinicId: string,
  options?: ClinicRealtimeOptions,
) {
  return useClinicRealtime(clinicId, options);
}
