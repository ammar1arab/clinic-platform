import { dashboardService, DashboardKpis, RoomUtilization } from '@/services/dashboard.service';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useFetchData, clinicListOptions, DASHBOARD_OPTIONS } from '../query';
import { useClinicRealtime, type ClinicRealtimeOptions } from './use-clinic-realtime';

export function useDashboardKpis(clinicId: string, practitionerId?: string, enabled = true) {
  return useFetchData<DashboardKpis>({
    queryKey: QUERY_KEYS.dashboard.kpis(clinicId, practitionerId),
    request: () => dashboardService.getKpis(clinicId, practitionerId),
    options: {
      ...clinicListOptions(clinicId),
      enabled: enabled && !!clinicId,
      ...DASHBOARD_OPTIONS,
    },
  });
}

export function useRoomUtilization(clinicId: string, practitionerId?: string, enabled = true) {
  return useFetchData<RoomUtilization[]>({
    queryKey: QUERY_KEYS.dashboard.roomUtilization(clinicId, practitionerId),
    request: () => dashboardService.getRoomUtilization(clinicId, practitionerId),
    options: {
      ...clinicListOptions(clinicId),
      enabled: enabled && !!clinicId,
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
