import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CreatePatientDto,
  UpdatePatientDto,
  PatientFiltersDto,
  PatientSortBy,
  SortOrder,
} from "./dto";

@Injectable()
export class PatientsRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePatientDto) {
    const data: Prisma.PatientUncheckedCreateInput = {
      clinicId: dto.clinicId,
      firstNameEn: dto.firstNameEn,
      lastNameEn: dto.lastNameEn,
      firstNameAr: dto.firstNameAr,
      lastNameAr: dto.lastNameAr,
      nationalId: dto.nationalId,
      phone: dto.phone,
      email: dto.email,
      gender: dto.gender,
      bloodType: dto.bloodType,
      allergies: dto.allergies,
      emergencyContactName: dto.emergencyContactName,
      emergencyContactPhone: dto.emergencyContactPhone,
      address: dto.address,
      imageUrl: dto.imageUrl,
      dob: dto.dob ? new Date(dto.dob) : null,
      packageId: dto.packageId === "" ? null : (dto.packageId ?? null),
      discountCodeId:
        dto.discountCodeId === "" ? null : (dto.discountCodeId ?? null),
    };
    return this.prisma.patient.create({ data });
  }

  findAllByClinic(filters: PatientFiltersDto) {
    const {
      clinicId,
      search,
      isActive,
      gender,
      bloodType,
      primaryDoctorId,
      departmentId,
      visitFrom,
      visitTo,
      dobFrom,
      dobTo,
      sortBy = PatientSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
      page,
      limit,
    } = filters;

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit ?? undefined;

    const where: Prisma.PatientWhereInput = { clinicId };

    if (isActive !== undefined) {
      where.isActive = isActive === true || String(isActive) === "true";
    }

    if (gender) where.gender = { equals: gender, mode: "insensitive" };
    if (bloodType) where.bloodType = { equals: bloodType, mode: "insensitive" };
    if (primaryDoctorId) where.primaryDoctorId = primaryDoctorId;

    if (dobFrom || dobTo) {
      const dobFilter: Prisma.DateTimeNullableFilter = {};
      if (dobFrom) {
        const dateStr = dobFrom.includes("T") ? dobFrom.split("T")[0] : dobFrom;
        dobFilter.gte = new Date(`${dateStr}T00:00:00.000Z`);
      }
      if (dobTo) {
        const dateStr = dobTo.includes("T") ? dobTo.split("T")[0] : dobTo;
        dobFilter.lte = new Date(`${dateStr}T23:59:59.999Z`);
      }
      where.dob = dobFilter;
    }

    if (departmentId || visitFrom || visitTo) {
      const appointmentSome: Prisma.AppointmentWhereInput = {};

      if (departmentId) {
        appointmentSome.departmentId = departmentId;
      }

      if (visitFrom || visitTo) {
        appointmentSome.status = "completed";
        const scheduledAt: Prisma.DateTimeFilter = {};
        if (visitFrom) {
          const dateStr = visitFrom.includes("T")
            ? visitFrom.split("T")[0]
            : visitFrom;
          scheduledAt.gte = new Date(`${dateStr}T00:00:00.000Z`);
        }
        if (visitTo) {
          const dateStr = visitTo.includes("T")
            ? visitTo.split("T")[0]
            : visitTo;
          scheduledAt.lte = new Date(`${dateStr}T23:59:59.999Z`);
        }
        appointmentSome.scheduledAt = scheduledAt;
      }

      where.appointments = { some: appointmentSome };
    }

    if (search) {
      where.OR = [
        { firstNameEn: { contains: search, mode: "insensitive" } },
        { lastNameEn: { contains: search, mode: "insensitive" } },
        { firstNameAr: { contains: search, mode: "insensitive" } },
        { lastNameAr: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { nationalId: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: Prisma.PatientOrderByWithRelationInput =
      sortBy === PatientSortBy.APPOINTMENTS
        ? { appointments: { _count: sortOrder } }
        : { [sortBy]: sortOrder };

    return this.prisma.patient.findMany({
      where,
      include: {
        primaryDoctor: { select: { id: true, name: true } },
        package: {
          select: {
            id: true,
            name: true,
            price: true,
            discountType: true,
            discountValue: true,
          },
        },
        discountCode: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
            isActive: true,
          },
        },
        appointments: {
          where: { status: "completed" },
          orderBy: { scheduledAt: "asc" },
        },
      },
      orderBy,
      skip,
      take,
    });
  }

  findById(id: string) {
    return this.prisma.patient.findUnique({
      where: { id },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            price: true,
            discountType: true,
            discountValue: true,
            isActive: true,
          },
        },
        discountCode: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
            isActive: true,
          },
        },
        appointments: {
          orderBy: { scheduledAt: "desc" },
          include: {
            doctor: true,
            service: true,
            room: true,
            referrals: {
              include: {
                fromDoctor: { select: { id: true, name: true } },
                toDoctor: { select: { id: true, name: true } },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });
  }

  findReferralsByPatientId(patientId: string) {
    return this.prisma.referral.findMany({
      where: { appointment: { patientId } },
      include: {
        fromDoctor: { select: { id: true, name: true } },
        toDoctor: { select: { id: true, name: true } },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  update(id: string, dto: UpdatePatientDto) {
    const data: Prisma.PatientUncheckedUpdateInput = {};

    if (dto.firstNameEn !== undefined) data.firstNameEn = dto.firstNameEn;
    if (dto.lastNameEn !== undefined) data.lastNameEn = dto.lastNameEn;
    if (dto.firstNameAr !== undefined) data.firstNameAr = dto.firstNameAr;
    if (dto.lastNameAr !== undefined) data.lastNameAr = dto.lastNameAr;
    if (dto.nationalId !== undefined) data.nationalId = dto.nationalId;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.bloodType !== undefined) data.bloodType = dto.bloodType;
    if (dto.allergies !== undefined) data.allergies = dto.allergies;
    if (dto.emergencyContactName !== undefined) {
      data.emergencyContactName = dto.emergencyContactName;
    }
    if (dto.emergencyContactPhone !== undefined) {
      data.emergencyContactPhone = dto.emergencyContactPhone;
    }
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;

    if (dto.dob !== undefined) {
      data.dob = dto.dob ? new Date(dto.dob) : null;
    }
    if (dto.packageId !== undefined) {
      data.packageId = dto.packageId === "" ? null : dto.packageId;
    }
    if (dto.discountCodeId !== undefined) {
      data.discountCodeId =
        dto.discountCodeId === "" ? null : dto.discountCodeId;
    }

    return this.prisma.patient.update({ where: { id }, data });
  }

  setActive(id: string, isActive: boolean) {
    return this.prisma.patient.update({
      where: { id },
      data: { isActive },
    });
  }

  hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const appointments = await tx.appointment.findMany({
        where: { patientId: id },
        select: { id: true },
      });
      const appointmentIds = appointments.map((a) => a.id);

      if (appointmentIds.length > 0) {
        await tx.referral.deleteMany({
          where: { appointmentId: { in: appointmentIds } },
        });
      }

      await tx.appointment.deleteMany({
        where: { patientId: id },
      });

      return tx.patient.delete({ where: { id } });
    });
  }
}
