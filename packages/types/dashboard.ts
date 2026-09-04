export interface DashboardKpis {
  total: number;
  inProgress: number;
  waitingCount: number;
  avgWaitingMins: number | null;
  completed: number;
  cancelled: number;
  roomCount: number;
}

export interface RoomUtilization {
  roomId: string;
  roomName: string;
  roomNameAr?: string | null;
  bookedMinutes: number;
  workingMinutes: number;
  utilisationPercent: number;
}
