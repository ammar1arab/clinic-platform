import { SHARED_EN } from "@clinic/types";
import { formatClockRange } from "./availability-rules";
import { DashboardGateway } from "@/modules/dashboard/dashboard.gateway";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import type { AuthUser } from "@/modules/auth/types";
import { NotificationsService } from "@/modules/notifications/notifications.service";
import { createLogger } from "@/infrastructure";
import { PractitionersRepository } from "./practitioners.repository";
import {
  CreateScheduleRequestDto,
  ReviewScheduleRequestDto,
  ScheduleRequestFiltersDto,
} from "./dto/schedule-request.dto";

@Injectable()
export class ScheduleRequestsService {
  private readonly log = createLogger(ScheduleRequestsService.name);
  constructor(
    private repo: PractitionersRepository,
    private notifications: NotificationsService,
    private gateway: DashboardGateway,
  ) {}

  list(actor: AuthUser, filters: ScheduleRequestFiltersDto) {
    return this.repo.scheduleRequests(actor.clinicId, {
      doctorId: actor.role === Role.practitioner ? actor.clinicUserId : filters.doctorId,
      departmentId: filters.departmentId,
      group: filters.group,
      sort: filters.sort,
      page: filters.page,
      kind: filters.kind,
      search: filters.search,
    });
  }

  async create(actor: AuthUser, dto: CreateScheduleRequestDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (
      !Number.isFinite(startAt.getTime()) ||
      !Number.isFinite(endAt.getTime()) ||
      startAt <= new Date() ||
      endAt <= startAt ||
      endAt.getTime() - startAt.getTime() > 366 * 86400000 ||
      (dto.kind === "leave" && endAt.getTime() - startAt.getTime() > 86400000)
    ) {
      throw new BadRequestException({
        code: "scheduleRequestRange",
        message: "Choose a future period",
      });
    }
    const result = await this.repo.scheduleWrite(actor.clinicId, async (tx) => {
      const doctor = await tx.clinicUser.findFirst({
        where: {
          id: actor.clinicUserId,
          clinicId: actor.clinicId,
          role: Role.practitioner,
          isActive: true,
        },
      });
      if (!doctor) throw new ForbiddenException();
      const clinic = await tx.clinic.findUnique({
        where: { id: actor.clinicId },
        select: { workingHoursStart: true, workingHoursEnd: true, timezone: true },
      });
      const opening = clinic?.workingHoursStart ?? "00:00";
      const closing = clinic?.workingHoursEnd ?? "23:59";
      const localTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: clinic?.timezone || "UTC",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
      const from = localTime.format(startAt);
      const to = localTime.format(endAt);
      const kind = dto.kind === "leave" && from <= opening && to >= closing ? "vacation" : dto.kind;
      if (kind !== "vacation" && (from < opening || to > closing)) {
        throw new BadRequestException({
          code: "scheduleRequestClinicHours",
          message: `Choose a time within clinic hours (${formatClockRange(opening, closing)})`,
        });
      }
      if (
        await tx.practitionerScheduleRequest.findFirst({
          where: {
            clinicId: actor.clinicId,
            doctorId: doctor.id,
            kind,
            status: "pending",
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
        })
      ) {
        throw new ConflictException({
          code: "scheduleRequestDuplicate",
          message: "An overlapping request is already awaiting review",
        });
      }
      const request = await tx.practitionerScheduleRequest.create({
        data: {
          clinicId: actor.clinicId,
          doctorId: doctor.id,
          kind,
          startAt,
          endAt,
          reason: dto.reason.trim(),
        },
      });
      const reviewers = await this.repo.scheduleReviewers(tx, actor.clinicId);
      return { request, reviewers };
    });
    this.gateway.emitScheduleRequestChanged(actor.clinicId);
    await this.notify(
      actor.clinicId,
      result.reviewers.map((row) => row.id),
      "schedule_request_pending",
      result.request.id,
      result.request.doctorId,
    );
    return result.request;
  }

  async review(actor: AuthUser, id: string, dto: ReviewScheduleRequestDto) {
    const { request, recipients } = await this.repo.scheduleWrite(
      actor.clinicId,
      async (tx) => {
        const row = await tx.practitionerScheduleRequest.findFirst({
          where: { id, clinicId: actor.clinicId },
        });
        if (!row) throw new NotFoundException();
        const withdrawal = dto.decision === "withdrawn";
        if (
          withdrawal
            ? actor.clinicUserId !== row.doctorId
            : actor.role !== Role.owner && actor.role !== Role.admin
        )
          throw new ForbiddenException();
        if (row.status !== "pending")
          throw new ConflictException({
            code: "scheduleRequestReviewed",
            message: "This request has already been reviewed",
          });
        if (dto.decision === "declined" && !dto.reviewNote?.trim())
          throw new BadRequestException({
            code: "scheduleRequestDeclineReason",
            message: "Provide a reason for declining the request",
          });
        if (dto.decision === "approved") {
          const doctor = await tx.clinicUser.findFirst({
            where: {
              id: row.doctorId,
              clinicId: actor.clinicId,
              isActive: true,
              role: Role.practitioner,
            },
          });
          if (!doctor || row.startAt <= new Date())
            throw new ConflictException({
              code: "scheduleRequestExpired",
              message:
                "The request must be for an active practitioner and a future period",
            });
          const leave = await tx.doctorTimeOff.findFirst({
            where: {
              doctorId: row.doctorId,
              startDate: { lt: row.endAt },
              endDate: { gt: row.startAt },
            },
          });
          const extra = row.kind === "extra" && await tx.doctorAvailabilityOverride.findFirst({
            where: {
              doctorId: row.doctorId,
              startAt: { lt: row.endAt },
              endAt: { gt: row.startAt },
            },
          });
          if (leave || extra)
            throw new ConflictException({
              code: "scheduleRequestOverlap",
              message:
                "This period overlaps existing leave or extra availability",
            });
          if (row.kind !== "extra") {
            await this.repo.assertLeaveAvailable(
              tx,
              actor.clinicId,
              row.doctorId,
              row.startAt,
              row.endAt,
            );
            await tx.doctorTimeOff.create({
              data: {
                doctorId: row.doctorId,
                startDate: row.startAt,
                endDate: row.endAt,
                reason: row.reason,
                kind: row.kind === "vacation" ? "vacation" : "leave",
              },
            });
          } else {
            await tx.doctorAvailabilityOverride.create({
              data: {
                doctorId: row.doctorId,
                startAt: row.startAt,
                endAt: row.endAt,
                reason: row.reason,
              },
            });
          }
        }
        const request = await tx.practitionerScheduleRequest.update({
          where: { id: row.id },
          data: {
            status: dto.decision,
            reviewNote: dto.reviewNote?.trim() || null,
            reviewedAt: new Date(),
            reviewedById: actor.clinicUserId,
          },
        });
        const recipients = withdrawal ? await this.repo.scheduleReviewers(tx, actor.clinicId) : [{ id: row.doctorId }];
        return { request, recipients };
      },
    );
    this.gateway.emitScheduleRequestChanged(actor.clinicId, dto.decision === "approved");
    await this.notify(
        actor.clinicId,
        recipients.map((row) => row.id),
        `schedule_request_${dto.decision}`,
        request.id,
        request.doctorId,
      );
    return request;
  }

  private async notify(
    clinicId: string,
    userIds: string[],
    type: string,
    requestId: string,
    doctorId: string,
  ) {
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          await this.notifications.create({
            clinicId,
            userId,
            type,
            title: (SHARED_EN.notificationTypes as Record<string, string>)[type] ?? type,
            payload: { requestId, doctorId },
          });
        } catch (error) {
          this.log.warn("schedule_request_notification_failed", {
            requestId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }),
    );
  }
}
