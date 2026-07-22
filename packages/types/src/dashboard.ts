export interface DashboardKpis {
  total: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  roomCount: number;
}

export interface RoomUtilization {
  roomId: string;
  roomName: string;
  bookedMinutes: number;
  workingMinutes: number;
  utilisationPercent: number;
}
