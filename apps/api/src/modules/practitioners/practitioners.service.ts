import { welcomeEmail } from "@/security/auth-email";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import {
  EmailService,
  createLogger,
  defaultAvatarUrl,
  persistableImageUrl,
} from "@/infrastructure";
import { PractitionersRepository } from "./practitioners.repository";
import {
  AssignServicesDto,
  CreatePractitionerDto,
  ReplaceAvailabilityDto,
  ReplaceTimeOffDto,
  UpdatePractitionerDto,
} from "./dto";
import {
  initialsFromName,
  mapPractitioner,
  optDate,
  optStr,
} from "./practitioners.mapper";

@Injectable()
export class PractitionersService {
  private readonly log = createLogger(PractitionersService.name);

  constructor(
    private repo: PractitionersRepository,
    private email: EmailService,
  ) {}

  async create(dto: CreatePractitionerDto) {
    await this.assertRefs(dto.clinicId, dto);
    this.assertCommission(dto.employmentType, dto.commissionPercent);

    const email = dto.email.trim().toLowerCase();
    if (await this.repo.emailExists(email)) {
      throw new ConflictException("Email already registered");
    }

    const temporaryPassword = email;
    const row = await this.repo.createWithUser({
      dto: {
        ...dto,
        email,
        imageUrl: persistableImageUrl(dto.imageUrl) || defaultAvatarUrl(email),
      },
      passwordHash: await bcrypt.hash(temporaryPassword, 12),
      initials: initialsFromName(dto.name),
    });

    const practitioner = mapPractitioner(row);
    const welcomeEmailSent = await this.sendWelcomeEmail({
      to: email,
      name: practitioner.name,
      temporaryPassword,
    });

    return { practitioner, welcomeEmailSent };
  }

  async findAll(clinicId: string) {
    if (!clinicId) throw new BadRequestException("clinicId is required");
    return (await this.repo.findAllByClinic(clinicId)).map(mapPractitioner);
  }

  async findOne(id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException("Practitioner not found");
    return mapPractitioner(row);
  }

  async update(id: string, dto: UpdatePractitionerDto) {
    const existing = await this.findOne(id);
    await this.assertRefs(existing.clinicId, {
      departmentId: dto.departmentId ?? existing.departmentId ?? undefined,
      defaultRoomId:
        dto.defaultRoomId === undefined
          ? existing.defaultRoomId
          : dto.defaultRoomId,
      serviceIds: dto.serviceIds,
    });

    const nextEmployment =
      dto.employmentType === undefined
        ? existing.employmentType
        : dto.employmentType;
    const nextCommission =
      dto.commissionPercent === undefined
        ? existing.commissionPercent
        : dto.commissionPercent;
    this.assertCommission(nextEmployment ?? undefined, nextCommission);

    const row = await this.repo.updateProfile(id, dto, {
      name: dto.name?.trim(),
      nameAr: optStr(dto.nameAr),
      title: optStr(dto.title),
      phone: optStr(dto.phone),
      whatsapp: optStr(dto.whatsapp),
      nationality:
        dto.nationality === undefined
          ? undefined
          : dto.nationality?.trim()
            ? dto.nationality.trim().toUpperCase()
            : null,
      specialty: optStr(dto.specialty),
      specialtyAr: optStr(dto.specialtyAr),
      languages: dto.languages,
      initials: dto.name ? initialsFromName(dto.name) : undefined,
      dob: optDate(dto.dob),
      gender: optStr(dto.gender),
      bio: optStr(dto.bio),
      bioAr: optStr(dto.bioAr),
      experienceYears: dto.experienceYears,
      imageUrl:
        dto.imageUrl === undefined
          ? undefined
          : (persistableImageUrl(dto.imageUrl) ?? undefined),
      licenseNumber: optStr(dto.licenseNumber),
      licenseExpiry: optDate(dto.licenseExpiry),
      department:
        dto.departmentId === undefined
          ? undefined
          : { connect: { id: dto.departmentId } },
      defaultRoom:
        dto.defaultRoomId === undefined
          ? undefined
          : dto.defaultRoomId
            ? { connect: { id: dto.defaultRoomId } }
            : { disconnect: true },
      employmentType: dto.employmentType,
      commissionPercent:
        dto.commissionPercent === undefined ? undefined : dto.commissionPercent,
      bufferMins: dto.bufferMins,
    });
    return mapPractitioner(row);
  }

  async replaceServices(id: string, dto: AssignServicesDto) {
    const existing = await this.findOne(id);
    await this.assertRefs(existing.clinicId, { serviceIds: dto.serviceIds });
    return mapPractitioner(await this.repo.replaceServices(id, dto.serviceIds));
  }

  async replaceAvailability(id: string, dto: ReplaceAvailabilityDto) {
    await this.findOne(id);
    return mapPractitioner(
      await this.repo.replaceAvailability(id, dto.availabilities),
    );
  }

  async replaceTimeOff(id: string, dto: ReplaceTimeOffDto) {
    await this.findOne(id);
    return mapPractitioner(await this.repo.replaceTimeOff(id, dto.timeOffs));
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return mapPractitioner(await this.repo.deactivate(id));
  }

  async reactivate(id: string) {
    await this.findOne(id);
    return mapPractitioner(await this.repo.reactivate(id));
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.hardDelete(id);
  }

  private assertCommission(
    employmentType?: string | null,
    commissionPercent?: number | null,
  ) {
    if (employmentType === "commission" || employmentType === "mixed") {
      if (
        commissionPercent == null ||
        !Number.isFinite(commissionPercent) ||
        commissionPercent < 0 ||
        commissionPercent > 100
      ) {
        throw new BadRequestException(
          "Commission percent (0-100) is required for commission or mixed employment",
        );
      }
    }
  }

  private async sendWelcomeEmail(input: {
    to: string;
    name: string;
    temporaryPassword: string;
  }) {
    try {
      const result = await this.email.send({
        to: input.to,
        ...welcomeEmail(input),
      });
      return !result.skipped;
    } catch (err) {
      this.log.warn("welcome_email_failed", {
        to: input.to,
        error: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }

  private async assertRefs(
    clinicId: string,
    dto: {
      departmentId?: string;
      defaultRoomId?: string | null;
      serviceIds?: string[];
    },
  ) {
    if (dto.departmentId) {
      const ok = await this.repo.departmentInClinic(dto.departmentId, clinicId);
      if (!ok) throw new BadRequestException("Invalid department");
    }
    if (dto.defaultRoomId) {
      const ok = await this.repo.roomInClinic(dto.defaultRoomId, clinicId);
      if (!ok) throw new BadRequestException("Invalid room");
    }
    if (dto.serviceIds?.length) {
      const count = await this.repo.countServicesInClinic(
        dto.serviceIds,
        clinicId,
      );
      if (count !== dto.serviceIds.length) {
        throw new BadRequestException("One or more services are invalid");
      }
    }
  }
}
