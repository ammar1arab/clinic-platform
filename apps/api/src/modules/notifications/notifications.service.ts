import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { NotificationsRepository } from "./notifications.repository";
import { DashboardGateway } from "@/modules/dashboard/dashboard.gateway";
import { CreateNotificationDto, NotificationFiltersDto } from "./dto";

@Injectable()
export class NotificationsService {
  constructor(
    private notificationsRepository: NotificationsRepository,
    private dashboardGateway: DashboardGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = await this.notificationsRepository.create(dto);
    this.dashboardGateway.emitNotificationCreated(dto.clinicId, dto.userId);
    return notification;
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

  async markRead(id: string) {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification) {
      throw new NotFoundException("Notification not found");
    }
    if (notification.readAt) {
      return notification;
    }
    return this.notificationsRepository.markRead(id);
  }

  async markAllRead(clinicId: string, userId: string) {
    if (!clinicId || !userId) {
      throw new BadRequestException("clinicId and userId are required");
    }
    await this.notificationsRepository.markAllRead(clinicId, userId);
    return this.notificationsRepository.findRecent(clinicId, userId);
  }
}
