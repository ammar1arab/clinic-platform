import { api } from '@/lib/api';
import type { DashboardKpis, RoomUtilization } from '@clinic/types';

export type { DashboardKpis, RoomUtilization };

export const dashboardService = {
  getKpis: (clinicId: string) =>
    api.get<DashboardKpis>('/dashboard/kpis', { params: { clinicId } }).then((r) => r.data),

  getRoomUtilization: (clinicId: string) =>
    api
      .get<RoomUtilization[]>('/dashboard/room-utilization', { params: { clinicId } })
      .then((r) => r.data),
};
