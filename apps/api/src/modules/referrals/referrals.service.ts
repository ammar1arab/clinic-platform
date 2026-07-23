import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { ReferralsRepository } from "./referrals.repository";
import { NotificationsService } from "@/modules/notifications/notifications.service";
import { DashboardGateway } from "@/modules/dashboard/dashboard.gateway";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CreateReferralDto,
  ReferralOpinionDto,
  ReferralFiltersDto,
} from "./dto";

@Injectable()
export class ReferralsService {
  constructor(
    private referralsRepository: ReferralsRepository,
    private notificationsService: NotificationsService,
    private dashboardGateway: DashboardGateway,
    private prisma: PrismaService,
  ) {}

  async create(fromDoctorId: string, dto: CreateReferralDto) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: dto.appointmentId, clinicId: dto.clinicId },
    });
    if (!appointment) {
      throw new BadRequestException("Invalid appointment for this clinic");
    }

    const toDoctor = await this.prisma.clinicUser.findFirst({
      where: { id: dto.toDoctorId, clinicId: dto.clinicId, isActive: true },
    });
    if (!toDoctor) {
      throw new BadRequestException("Invalid or inactive receiving doctor");
    }

    if (dto.toDoctorId === fromDoctorId) {
      throw new BadRequestException("Cannot refer to yourself");
    }

    const referral = await this.referralsRepository.create({
      ...dto,
      fromDoctorId,
    });

    await this.notificationsService.create({
      clinicId: dto.clinicId,
      userId: dto.toDoctorId,
      type: "referral_created",
      title: `New ${dto.type} request`,
      body: dto.reason,
      payload: { referralId: referral.id, appointmentId: dto.appointmentId },
    });

    this.dashboardGateway.emitReferralChanged(dto.clinicId);
    return referral;
  }

  findAll(filters: ReferralFiltersDto) {
    return this.referralsRepository.findAll(filters);
  }

  async findOne(id: string) {
    const referral = await this.referralsRepository.findById(id);
    if (!referral) {
      throw new NotFoundException("Referral not found");
    }
    return referral;
  }

  async accept(id: string, clinicUserId: string) {
    const referral = await this.findOne(id);
    if (referral.toDoctorId !== clinicUserId) {
      throw new ForbiddenException(
        "Only the receiving doctor can accept this referral",
      );
    }
    if (referral.status !== "pending") {
      throw new BadRequestException("Referral is not pending");
    }

    const updated = await this.referralsRepository.updateStatus(id, "accepted");

    await this.notificationsService.create({
      clinicId: referral.clinicId,
      userId: referral.fromDoctorId,
      type: "referral_accepted",
      title: "Referral accepted",
      body: `Your ${referral.type} was accepted`,
      payload: { referralId: referral.id },
    });

    this.dashboardGateway.emitReferralChanged(referral.clinicId);
    return updated;
  }

  async reject(id: string, clinicUserId: string) {
    const referral = await this.findOne(id);
    if (referral.toDoctorId !== clinicUserId) {
      throw new ForbiddenException(
        "Only the receiving doctor can reject this referral",
      );
    }
    if (referral.status !== "pending") {
      throw new BadRequestException("Referral is not pending");
    }

    const updated = await this.referralsRepository.updateStatus(id, "rejected");

    await this.notificationsService.create({
      clinicId: referral.clinicId,
      userId: referral.fromDoctorId,
      type: "referral_rejected",
      title: "Referral rejected",
      body: `Your ${referral.type} was rejected`,
      payload: { referralId: referral.id },
    });

    this.dashboardGateway.emitReferralChanged(referral.clinicId);
    return updated;
  }

  async setOpinion(id: string, clinicUserId: string, dto: ReferralOpinionDto) {
    const referral = await this.findOne(id);
    if (referral.toDoctorId !== clinicUserId) {
      throw new ForbiddenException(
        "Only the receiving doctor can provide an opinion",
      );
    }
    if (referral.type !== "consultation") {
      throw new BadRequestException(
        "Opinion is only allowed for consultations",
      );
    }

    const updated = await this.referralsRepository.updateOpinion(
      id,
      dto.opinion,
    );
    this.dashboardGateway.emitReferralChanged(referral.clinicId);
    return updated;
  }
}
