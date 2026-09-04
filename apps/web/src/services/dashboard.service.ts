import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type { DashboardKpis, RoomUtilization } from "@clinic/types";

export type { DashboardKpis, RoomUtilization };

export const dashboardService = {
  getKpis: (clinicId: string) =>
    api
      .get<DashboardKpis>(ENDPOINTS.DASHBOARD.KPIS, { params: { clinicId } })
      .then((r) => r.data),

  getRoomUtilization: (clinicId: string) =>
    api
      .get<
        RoomUtilization[]
      >(ENDPOINTS.DASHBOARD.ROOM_UTILIZATION, { params: { clinicId } })
      .then((r) => r.data),
};
