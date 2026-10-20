import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { NotificationsRepository } from "./notifications.repository";
import { DashboardGateway } from "@/modules/dashboard/dashboard.gateway";
import { CreateNotificationDto, NotificationFiltersDto } from "./dto";
import { NOTIFICATION_TYPE, type NotificationPrefs } from "@clinic/types";

type DoctorEvent = {
  clinicId: string;
  doctorId: string;
  appointmentId: string;
  scheduledAt: Date;
  patient: { firstNameEn: string; lastNameEn: string; firstNameAr?: string | null; lastNameAr?: string | null };
  actorId?: string;
};

const DOCTOR_EVENT_TITLES: Record<string, string> = {
  [NOTIFICATION_TYPE.APPOINTMENT_BOOKED]: "New appointment",
  [NOTIFICATION_TYPE.APPOINTMENT_RESCHEDULED]: "Appointment rescheduled",
  [NOTIFICATION_TYPE.APPOINTMENT_CANCELLED]: "Appointment cancelled",
  [NOTIFICATION_TYPE.QUEUE_PATIENT_WAITING]: "Patient is waiting",
};

@Injectable()
export class NotificationsService {
  constructor(
    private notificationsRepository: NotificationsRepository,
    private dashboardGateway: DashboardGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = await this.notificationsRepository.create(dto);
    if (notification) this.dashboardGateway.emitNotificationCreated(dto.clinicId, dto.userId, dto.type);
    return notification;
  }

  async notifyDoctor(type: string, event: DoctorEvent) {
    if (event.actorId && event.actorId === event.doctorId) return;
    const { patient } = event;
    const nameAr = [patient.firstNameAr, patient.lastNameAr].filter(Boolean).join(" ");
    try {
      await this.create({
        clinicId: event.clinicId,
        userId: event.doctorId,
        type,
        title: DOCTOR_EVENT_TITLES[type] ?? type,
        body: `${patient.firstNameEn} ${patient.lastNameEn}`,
        payload: {
          appointmentId: event.appointmentId,
          scheduledAt: event.scheduledAt.toISOString(),
          patientName: `${patient.firstNameEn} ${patient.lastNameEn}`,
          patientNameAr: nameAr || null,
        },
      });
    } catch {
      return;
    }
  }

  preferences(clinicId: string, userId: string) {
    return this.notificationsRepository.preferences(clinicId, userId);
  }

  setPreferences(clinicId: string, userId: string, prefs: Partial<NotificationPrefs>) {
    return this.notificationsRepository.setPreferences(clinicId, userId, prefs);
  }

  findAll(filters: NotificationFiltersDto) {
    if (!filters.clinicId || !filters.userId) {
      throw new BadRequestException("clinicId and userId are required");
    }
    return this.notificationsRepository.findRecent(
      filters.clinicId,
      filters.userId,
    );
  }

  async markRead(id: string, clinicId: string, userId: string) {
    const notification = await this.notificationsRepository.findById(
      id,
      clinicId,
      userId,
    );
    if (!notification) {
      throw new NotFoundException("Notification not found");
    }
    if (notification.readAt) {
      return notification;
    }
    return this.notificationsRepository.markRead(id, clinicId, userId);
  }

  async clear(clinicId: string, userId: string) {
    await this.notificationsRepository.clear(clinicId, userId);
    return [];
  }

  async markAllRead(clinicId: string, userId: string) {
    if (!clinicId || !userId) {
      throw new BadRequestException("clinicId and userId are required");
    }
    await this.notificationsRepository.markAllRead(clinicId, userId);
    return this.notificationsRepository.findRecent(clinicId, userId);
  }
}
