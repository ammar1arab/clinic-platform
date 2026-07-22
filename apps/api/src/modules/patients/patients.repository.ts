import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto, PatientFiltersDto, PatientSortBy, SortOrder } from './dto';

@Injectable()
export class PatientsRepository {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePatientDto) {
    const data: any = { ...dto };
    if (data.dob) {
      data.dob = new Date(data.dob);
    } else if (data.dob === null || data.dob === '') {
      data.dob = null;
    }
    if (data.packageId === '') data.packageId = null;
    if (data.discountCodeId === '') data.discountCodeId = null;
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

    const where: any = { clinicId };

    if (isActive !== undefined) {
      where.isActive = isActive === true || String(isActive) === 'true';
    }

    if (gender) where.gender = { equals: gender, mode: 'insensitive' };
    if (bloodType) where.bloodType = { equals: bloodType, mode: 'insensitive' };
    if (primaryDoctorId) where.primaryDoctorId = primaryDoctorId;

    if (dobFrom || dobTo) {
      where.dob = {};
      if (dobFrom) {
        const dateStr = dobFrom.includes('T') ? dobFrom.split('T')[0] : dobFrom;
        where.dob.gte = new Date(`${dateStr}T00:00:00.000Z`);
      }
      if (dobTo) {
        const dateStr = dobTo.includes('T') ? dobTo.split('T')[0] : dobTo;
        where.dob.lte = new Date(`${dateStr}T23:59:59.999Z`);
      }
    }

    if (departmentId || visitFrom || visitTo) {
      const appointmentSome: any = {};

      if (departmentId) {
        appointmentSome.departmentId = departmentId;
      }

      if (visitFrom || visitTo) {
        appointmentSome.status = 'completed';
        appointmentSome.scheduledAt = {};
        if (visitFrom) {
          const dateStr = visitFrom.includes('T') ? visitFrom.split('T')[0] : visitFrom;
          appointmentSome.scheduledAt.gte = new Date(`${dateStr}T00:00:00.000Z`);
        }
        if (visitTo) {
          const dateStr = visitTo.includes('T') ? visitTo.split('T')[0] : visitTo;
          appointmentSome.scheduledAt.lte = new Date(`${dateStr}T23:59:59.999Z`);
        }
      }

      where.appointments = { some: appointmentSome };
    }

    if (search) {
      where.OR = [
        { firstNameEn: { contains: search, mode: 'insensitive' } },
        { lastNameEn:  { contains: search, mode: 'insensitive' } },
        { firstNameAr: { contains: search, mode: 'insensitive' } },
        { lastNameAr:  { contains: search, mode: 'insensitive' } },
        { phone:       { contains: search } },
        { nationalId:  { contains: search } },
        { email:       { contains: search, mode: 'insensitive' } },
      ];
    }

    // Sort by appointment count uses Prisma _count relation ordering
    const orderBy =
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
          where: { status: 'completed' },
          orderBy: { scheduledAt: 'asc' },
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
          orderBy: { scheduledAt: 'desc' },
          include: {
            doctor: true,
            service: true,
            room: true,
            referrals: {
              include: {
                fromDoctor: { select: { id: true, name: true } },
                toDoctor: { select: { id: true, name: true } },
              },
              orderBy: { createdAt: 'desc' },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  update(id: string, dto: UpdatePatientDto) {
    const data: any = { ...dto };
    delete data.clinicId;
    if (data.dob) {
      data.dob = new Date(data.dob);
    } else if (data.dob === null || data.dob === '') {
      data.dob = null;
    }
    if (data.packageId === '') data.packageId = null;
    if (data.discountCodeId === '') data.discountCodeId = null;
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