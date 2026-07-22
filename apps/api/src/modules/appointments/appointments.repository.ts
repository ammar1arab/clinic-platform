import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentFiltersDto } from './dto';

@Injectable()
export class AppointmentsRepository {
  constructor(private prisma: PrismaService) {}

  create(clinicId: string, dto: CreateAppointmentDto & {
    fee?: any;
    discount?: any;
    discountType?: any;
    meetingUrl?: string;
  }) {
    return this.prisma.appointment.create({
      data: {
        ...dto,
        clinicId,
      },
      include: { patient: true, doctor: true, room: true, service: true },
    });
  }

  findAllByClinic(clinicId: string, filters: AppointmentFiltersDto) {
    return this.prisma.appointment.findMany({
      where: {
        clinicId,
        doctorId: filters.doctorId ?? undefined,
        departmentId: filters.departmentId ?? undefined,
        ...(filters.startDate && filters.endDate && {
          scheduledAt: {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate),
          },
        }),
      },
      include: { patient: true, doctor: true, room: true, service: true, paymentMethodRef: { select: { id: true, name: true } } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  findById(clinicId: string, id: string) {
    return this.prisma.appointment.findUnique({
      where: { id, clinicId },
      include: {
        patient: true,
        doctor: true,
        room: true,
        service: true,
        department: true,
        paymentMethodRef: { select: { id: true, name: true } },
      },
    });
  }

  update(clinicId: string, id: string, dto: UpdateAppointmentDto & {
    statusUpdatedBy?: string;
    statusUpdatedAt?: Date;
  }) {
    return this.prisma.appointment.update({
      where: { id, clinicId },
      data: dto,
      include: {
        patient: true,
        doctor: true,
        room: true,
        service: true,
        paymentMethodRef: { select: { id: true, name: true } },
      },
    });
  }

  markPaid(
    clinicId: string,
    id: string,
    data: {
      isPaid: boolean;
      paidAt: Date;
      paidById: string;
      paymentMethodId: string;
    },
  ) {
    return this.prisma.appointment.update({
      where: { id, clinicId },
      data: {
        ...data,
        // Clear legacy string; name comes from paymentMethodRef
        paymentMethod: null,
      },
      include: {
        patient: true,
        doctor: true,
        room: true,
        service: true,
        paymentMethodRef: { select: { id: true, name: true } },
      },
    });
  }

  markUnpaid(clinicId: string, id: string) {
    return this.prisma.appointment.update({
      where: { id, clinicId },
      data: {
        isPaid: false,
        paidAt: null,
        paidById: null,
        paymentMethodId: null,
        paymentMethod: null,
      },
      include: {
        patient: true,
        doctor: true,
        room: true,
        service: true,
        paymentMethodRef: { select: { id: true, name: true } },
      },
    });
  }

  async findConflict(clinicId: string, roomId: string, scheduledAt: Date, durationMins: number, excludeId?: string) {
    const startTime = scheduledAt.getTime();
    const endTime = startTime + durationMins * 60000;
    const startOfDay = new Date(scheduledAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduledAt);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        clinicId,
        roomId,
        id: excludeId ? { not: excludeId } : undefined,
        status: { notIn: ['cancelled', 'no_show'] },
        scheduledAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    return appointments.find(a => {
      const aStart = a.scheduledAt.getTime();
      const aEnd = aStart + a.durationMins * 60000;
      return startTime < aEnd && endTime > aStart;
    });
  }

  async findDoctorConflict(clinicId: string, doctorId: string, scheduledAt: Date, durationMins: number, excludeId?: string) {
    const startTime = scheduledAt.getTime();
    const endTime = startTime + durationMins * 60000;
    const startOfDay = new Date(scheduledAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduledAt);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        clinicId,
        doctorId,
        id: excludeId ? { not: excludeId } : undefined,
        status: { notIn: ['cancelled', 'no_show'] },
        scheduledAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    return appointments.find(a => {
      const aStart = a.scheduledAt.getTime();
      const aEnd = aStart + a.durationMins * 60000;
      return startTime < aEnd && endTime > aStart;
    });
  }
}