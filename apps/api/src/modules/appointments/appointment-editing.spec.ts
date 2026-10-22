import { AppointmentsRepository } from './appointments.repository';
import type { PrismaService } from '@/prisma/prisma.service';
import type { Prisma } from '@prisma/client';

describe('Appointment editing and arrival validity', () => {
  const current = { id: 'appointment', clinicId: 'clinic', patientId: 'patient', doctorId: 'doctor', roomId: 'room', status: 'waiting', scheduledAt: new Date('2026-12-01T10:00:00Z'), durationMins: 30, sessionType: 'in_person', meetingUrl: null, updatedAt: new Date(), inProgressAt: null };
  const tx = {
    $executeRaw: jest.fn(), $queryRaw: jest.fn(),
    appointment: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
    doctorTimeOff: { findFirst: jest.fn() },
    clinicUser: { findUniqueOrThrow: jest.fn() },
  };
  const prisma = { $transaction: jest.fn() };
  const repo = new AppointmentsRepository(prisma as unknown as PrismaService);
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((fn: (client: Prisma.TransactionClient) => unknown) => fn(tx as unknown as Prisma.TransactionClient));
    tx.appointment.findUniqueOrThrow.mockResolvedValue(current);
    tx.clinicUser.findUniqueOrThrow.mockResolvedValue({ bufferMins: 0 });
    tx.$queryRaw.mockResolvedValue([]);
  });
  it.each([{ doctorId: 'other-doctor' }, { roomId: 'other-room' }, { durationMins: 60 }, { scheduledAt: '2026-12-01T11:00:00Z' }])('clears arrival and waiting state when booking context changes: %j', async (change) => {
    await repo.update('clinic', 'appointment', change, current.updatedAt);
    expect(tx.appointment.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ presenceConfirmedAt: null, presenceSource: null, waitingStartedAt: null, status: 'confirmed' }) }));
  });
  it('keeps arrival for a notes-only edit', async () => {
    await repo.update('clinic', 'appointment', { notes: 'Reception note' }, current.updatedAt);
    const data = tx.appointment.update.mock.calls[0][0].data;
    expect(data).not.toHaveProperty('presenceConfirmedAt');
  });
  it('rejects stale edits before changing booking or consuming resources', async () => {
    await expect(repo.update('clinic', 'appointment', { doctorId: 'other' }, new Date(0))).rejects.toThrow();
    expect(tx.appointment.update).not.toHaveBeenCalled();
    expect(tx.$queryRaw).not.toHaveBeenCalled();
  });
  it('rechecks approved leave under the appointment write lock', async () => {
    tx.doctorTimeOff.findFirst.mockResolvedValue({ id: 'approved-leave' });
    await expect(repo.update('clinic', 'appointment', { durationMins: 60 }, current.updatedAt)).rejects.toThrow();
    expect(tx.appointment.update).not.toHaveBeenCalled();
    expect(tx.$executeRaw).toHaveBeenCalled();
  });
});
