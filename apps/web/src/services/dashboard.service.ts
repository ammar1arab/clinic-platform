import { api } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type { DashboardKpis, RoomUtilization } from "@clinic/types";

export type { DashboardKpis, RoomUtilization };

export const dashboardService = {
  getKpis: (clinicId: string, practitionerId?: string) =>
    api
      .get<DashboardKpis>(ENDPOINTS.DASHBOARD.KPIS, { params: { clinicId, practitionerId } })
      .then((r) => r.data),

  getRoomUtilization: (clinicId: string, practitionerId?: string) =>
    api
      .get<
        RoomUtilization[]
      >(ENDPOINTS.DASHBOARD.ROOM_UTILIZATION, { params: { clinicId, practitionerId } })
      .then((r) => r.data),
};
