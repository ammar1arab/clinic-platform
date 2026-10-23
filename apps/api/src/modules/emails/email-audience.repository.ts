import { emailError } from "./email-errors";
import { BadRequestException, Injectable } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { isEmail, validateSync } from "class-validator";
import { Prisma, Role } from "@prisma/client";
import { EMAIL_AUDIENCE, type EmailRecipientPreview } from "@clinic/types";
import { PrismaService } from "@/prisma/prisma.service";
import { EmailFiltersDto, EmailSelectionDto } from "./dto/email.dto";

export const MAX_EMAIL_RECIPIENTS = 500;

export const normalizeEmail = (value: string): string =>
  value.trim().toLowerCase();

@Injectable()
export class EmailAudienceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    clinicId: string,
    selection: EmailSelectionDto,
  ): Promise<EmailRecipientPreview[]> {
    if (
      !selection ||
      typeof selection !== "object" ||
      Array.isArray(selection)
    ) {
      throw new BadRequestException(emailError("invalidEmailSelection"));
    }
    const validated = plainToInstance(EmailSelectionDto, {
      filters: selection.filters,
      externalRecipients: selection.externalRecipients,
      excludedEmails: selection.excludedEmails,
    });
    if (
      validateSync(validated, { whitelist: true, forbidNonWhitelisted: true })
        .length
    ) {
      throw new BadRequestException(emailError("invalidEmailSelection"));
    }
    selection = validated;
    if (!selection.filters && !selection.externalRecipients?.length) {
      throw new BadRequestException(emailError("emailRecipientsRequired"));
    }

    const rows = selection.filters
      ? await this.find(clinicId, selection.filters)
      : [];

    if (
      selection.filters?.ids &&
      rows.length !== selection.filters.ids.length
    ) {
      throw new BadRequestException(emailError("emailRecipientNotFound"));
    }

    const excluded = new Set(
      (selection.excludedEmails ?? []).map(normalizeEmail),
    );

    const external: EmailRecipientPreview[] = (
      selection.externalRecipients ?? []
    ).map((r) => ({
      sourceId: null,
      audience: "external",
      email: r.email,
      name: r.name || "",
    }));

    const unique = new Map<string, EmailRecipientPreview>();

    [...rows, ...external].forEach((row) => {
      const email = normalizeEmail(row.email);
      if (!excluded.has(email) && isEmail(email) && !unique.has(email)) {
        unique.set(email, { ...row, email });
      }
    });

    if (unique.size > MAX_EMAIL_RECIPIENTS) {
      throw new BadRequestException(emailError("emailRecipientLimitExceeded"));
    }

    const suppressions = await this.prisma.emailSuppression.findMany({
      where: {
        clinicId,
        email: { in: [...unique.keys()] },
      },
      select: { email: true },
    });

    suppressions.forEach((s) => unique.delete(s.email));

    return [...unique.values()].sort((a, b) => a.email.localeCompare(b.email));
  }

  private async find(
    clinicId: string,
    filters: EmailFiltersDto,
  ): Promise<EmailRecipientPreview[]> {
    if (filters.audience === "all") {
      return this.findEveryone(clinicId, filters);
    }
    if (!Object.values(EMAIL_AUDIENCE).includes(filters.audience)) {
      throw new BadRequestException(emailError("invalidEmailSelection"));
    }
    const { audience, doctorId, serviceId } = filters;

    if (
      filters.appointmentFrom &&
      filters.appointmentTo &&
      new Date(filters.appointmentFrom) > new Date(filters.appointmentTo)
    ) {
      throw new BadRequestException(emailError("emailDateRangeInvalid"));
    }

    const hasAppointments = Boolean(
      doctorId ||
      serviceId ||
      filters.appointmentStatuses?.length ||
      filters.appointmentFrom ||
      filters.appointmentTo ||
      filters.isPaid !== undefined,
    );

    const isPatients = audience === EMAIL_AUDIENCE.PATIENTS;

    if (!isPatients && hasAppointments) {
      throw new BadRequestException(emailError("emailFiltersIncompatible"));
    }

    await this.validateReferences(clinicId, filters);

    if (isPatients) {
      return this.findPatients(clinicId, filters, hasAppointments);
    }

    return this.findStaff(clinicId, filters);
  }

  private async findEveryone(
    clinicId: string,
    filters: EmailFiltersDto,
  ): Promise<EmailRecipientPreview[]> {
    if (
      filters.ids?.length ||
      filters.doctorId ||
      filters.serviceId ||
      filters.appointmentStatuses?.length ||
      filters.appointmentFrom ||
      filters.appointmentTo ||
      filters.isPaid !== undefined
    ) {
      throw new BadRequestException(emailError("emailFiltersIncompatible"));
    }
    await this.validateReferences(clinicId, filters);
    const shared = { ...filters, ids: undefined };
    const [patients, staff] = await Promise.all([
      this.findPatients(
        clinicId,
        { ...shared, audience: EMAIL_AUDIENCE.PATIENTS },
        Boolean(filters.departmentId),
      ),
      this.findStaff(clinicId, {
        ...shared,
        audience: EMAIL_AUDIENCE.STAFF,
      }),
    ]);
    return [...patients, ...staff];
  }

  private async findPatients(
    clinicId: string,
    filters: EmailFiltersDto,
    hasAppointments: boolean,
  ): Promise<EmailRecipientPreview[]> {
    const { ids, search, doctorId, departmentId, serviceId } = filters;

    const appointment: Prisma.AppointmentWhereInput = {
      clinicId,
      ...(doctorId && { doctorId }),
      ...(serviceId && { serviceId }),
      ...(departmentId && { departmentId }),
      ...(filters.appointmentStatuses && {
        status: { in: filters.appointmentStatuses },
      }),
      ...(filters.isPaid !== undefined && { isPaid: filters.isPaid }),
      ...((filters.appointmentFrom || filters.appointmentTo) && {
        scheduledAt: {
          ...(filters.appointmentFrom && {
            gte: new Date(filters.appointmentFrom),
          }),
          ...(filters.appointmentTo && {
            lte: new Date(filters.appointmentTo),
          }),
        },
      }),
    };

    const patients = await this.prisma.patient.findMany({
      where: {
        clinicId,
        isActive: true,
        email: { not: null },
        ...(ids && { id: { in: ids } }),
        ...(hasAppointments || departmentId
          ? { appointments: { some: appointment } }
          : {}),
        ...(search && {
          OR: [
            { firstNameEn: { contains: search, mode: "insensitive" } },
            { lastNameEn: { contains: search, mode: "insensitive" } },
            { firstNameAr: { contains: search, mode: "insensitive" } },
            { lastNameAr: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id: true,
        firstNameEn: true,
        lastNameEn: true,
        firstNameAr: true,
        lastNameAr: true,
        email: true,
        phone: true,
        gender: true,
        primaryDoctor: {
          select: {
            department: { select: { name: true, nameAr: true } },
          },
        },
      },
      orderBy: { id: "asc" },
      take: MAX_EMAIL_RECIPIENTS + 1,
    });

    if (patients.length > MAX_EMAIL_RECIPIENTS) {
      throw new BadRequestException(emailError("emailRecipientLimitExceeded"));
    }

    return patients.map((p) => ({
      sourceId: p.id,
      audience: EMAIL_AUDIENCE.PATIENTS,
      name: `${p.firstNameEn} ${p.lastNameEn}`.trim(),
      nameAr:
        [p.firstNameAr, p.lastNameAr].filter(Boolean).join(" ") || undefined,
      email: p.email || "",
      phone: p.phone,
      gender: p.gender,
      department: p.primaryDoctor?.department?.name,
      departmentAr: p.primaryDoctor?.department?.nameAr,
    }));
  }

  private async findStaff(
    clinicId: string,
    filters: EmailFiltersDto,
  ): Promise<EmailRecipientPreview[]> {
    const { audience, ids, search, departmentId } = filters;

    const staff = await this.prisma.clinicUser.findMany({
      where: {
        clinicId,
        isActive: true,
        ...(ids && { id: { in: ids } }),
        ...(audience === EMAIL_AUDIENCE.PRACTITIONERS
          ? { role: Role.practitioner }
          : audience === EMAIL_AUDIENCE.FINANCIAL
            ? { role: Role.financial }
            : audience === EMAIL_AUDIENCE.OWNERS
              ? { role: Role.owner }
              : audience === EMAIL_AUDIENCE.ADMINS
                ? { role: Role.admin }
                : {}),
        ...(departmentId && { departmentId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { nameAr: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        phone: true,
        gender: true,
        role: true,
        department: { select: { name: true, nameAr: true } },
        user: {
          select: { email: true },
        },
      },
      orderBy: { id: "asc" },
      take: MAX_EMAIL_RECIPIENTS + 1,
    });

    if (staff.length > MAX_EMAIL_RECIPIENTS) {
      throw new BadRequestException(emailError("emailRecipientLimitExceeded"));
    }

    return staff.map((member) => ({
      sourceId: member.id,
      audience:
        audience === EMAIL_AUDIENCE.STAFF || audience === "all"
          ? member.role === Role.practitioner
            ? EMAIL_AUDIENCE.PRACTITIONERS
            : member.role === Role.financial
              ? EMAIL_AUDIENCE.FINANCIAL
              : member.role === Role.owner
                ? EMAIL_AUDIENCE.OWNERS
                : member.role === Role.admin
                  ? EMAIL_AUDIENCE.ADMINS
                  : EMAIL_AUDIENCE.STAFF
          : audience,
      name: member.name,
      nameAr: member.nameAr ?? undefined,
      email: member.user.email,
      phone: member.phone,
      gender: member.gender,
      department: member.department?.name,
      departmentAr: member.department?.nameAr,
    }));
  }

  private async validateReferences(
    clinicId: string,
    filters: EmailFiltersDto,
  ): Promise<void> {
    if (filters.doctorId) {
      const doc = await this.prisma.clinicUser.findFirst({
        where: {
          id: filters.doctorId,
          clinicId,
          role: Role.practitioner,
          isActive: true,
        },
        select: { id: true },
      });
      if (!doc) {
        throw new BadRequestException(emailError("emailPractitionerNotFound"));
      }
    }

    if (filters.departmentId) {
      const dept = await this.prisma.department.findFirst({
        where: {
          id: filters.departmentId,
          clinicId,
          isActive: true,
        },
        select: { id: true },
      });
      if (!dept) {
        throw new BadRequestException(emailError("emailDepartmentNotFound"));
      }
    }

    if (filters.serviceId) {
      const srv = await this.prisma.service.findFirst({
        where: {
          id: filters.serviceId,
          clinicId,
          isActive: true,
        },
        select: { id: true },
      });
      if (!srv) {
        throw new BadRequestException(emailError("emailServiceNotFound"));
      }
    }
  }
}
