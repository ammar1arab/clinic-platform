import { Injectable, NotFoundException } from "@nestjs/common";
import { DashboardRepository } from "./dashboard.repository";

@Injectable()
export class DashboardService {
  constructor(private dashboardRepository: DashboardRepository) {}

  async getKpis(clinicId: string) {
    const [appointments, roomCount] = await Promise.all([
      this.dashboardRepository.findTodayAppointments(clinicId),
      this.dashboardRepository.countActiveRooms(clinicId),
    ]);

    const total = appointments.length;
    const inProgress = appointments.filter(
      (a) => a.status === "in_progress",
    ).length;
    const completed = appointments.filter(
      (a) => a.status === "completed",
    ).length;
    const cancelled = appointments.filter(
      (a) => a.status === "cancelled",
    ).length;

    return { total, inProgress, completed, cancelled, roomCount };
  }

  async getRoomUtilization(clinicId: string) {
    const [appointments, clinic, rooms] = await Promise.all([
      this.dashboardRepository.findTodayAppointments(clinicId),
      this.dashboardRepository.findClinicWorkingHours(clinicId),
      this.dashboardRepository.findActiveRooms(clinicId),
    ]);

    if (!clinic) {
      throw new NotFoundException("Clinic not found");
    }

    const [startHour, startMin] = clinic.workingHoursStart
      .split(":")
      .map(Number);
    const [endHour, endMin] = clinic.workingHoursEnd.split(":").map(Number);
    const workingMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);

    return rooms.map((room) => {
      const roomAppointments = appointments.filter(
        (a) => a.roomId === room.id && a.status !== "cancelled",
      );

      const bookedMinutes = roomAppointments.reduce(
        (sum, a) => sum + a.durationMins,
        0,
      );

      const utilisationPercent = Math.round(
        (bookedMinutes / workingMinutes) * 100,
      );

      return {
        roomId: room.id,
        roomName: room.name,
        bookedMinutes,
        workingMinutes,
        utilisationPercent: Math.min(utilisationPercent, 100),
      };
    });
  }
}
