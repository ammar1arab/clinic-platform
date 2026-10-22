import { VisitsService } from './visits.service';
import type { VisitsRepository, VisitTx, WorkspaceRow } from './visits.repository';
import type { TemplatesService } from './templates.service';
import type { VisitDocumentsService } from './visit-documents.service';
import type { DashboardGateway } from '@/modules/dashboard/dashboard.gateway';
import type { NotificationsService } from '@/modules/notifications/notifications.service';
import type { AuthUser } from '@/modules/auth/types';

jest.mock('./visit-presenter', () => ({ workspaceDto: (row: unknown) => row }));

const actor: AuthUser = { clinicId: 'clinic', clinicUserId: 'doctor', userId: 'user', role: 'practitioner' };
describe('Visit lifecycle safeguards', () => {
  const tx = { appointment: { update: jest.fn() }, visit: { findFirst: jest.fn(), create: jest.fn() } };
  const repo = { withAppointment: jest.fn(), withVisit: jest.fn(), appointment: jest.fn() };
  const templates = { defaultForVisit: jest.fn() };
  const gateway = { emitAppointmentChanged: jest.fn(), emitVisitChanged: jest.fn() };
  let row: WorkspaceRow;
  const service = new VisitsService(repo as unknown as VisitsRepository, templates as unknown as TemplatesService, {} as VisitDocumentsService, gateway as unknown as DashboardGateway, {} as NotificationsService);
  beforeEach(() => {
    jest.resetAllMocks();
    row = { id: 'appointment', doctorId: 'doctor', patientId: 'patient', roomId: 'room', revision: 2, status: 'waiting', sessionType: 'in_person', presenceConfirmedAt: new Date(), presenceSource: 'front_desk', visit: null } as unknown as WorkspaceRow;
    repo.withAppointment.mockImplementation((_actor: AuthUser, _id: string, run: (db: VisitTx, current: WorkspaceRow) => Promise<unknown>) => run(tx as unknown as VisitTx, row));
    repo.appointment.mockImplementation(async () => row);
  });
  it('does not move waiting patients backwards on repeated check-in', async () => {
    await service.presence(actor, row.id, 'practitioner');
    expect(tx.appointment.update).not.toHaveBeenCalled();
  });
  it('does not change the revision when the same waiting command is retried', async () => {
    await service.presence(actor, row.id, 'front_desk', true);
    expect(tx.appointment.update).not.toHaveBeenCalled();
  });
  it.each(['cancelled', 'no_show', 'completed'])('rejects presence for %s appointments', async (status) => {
    row.status = status as WorkspaceRow['status'];
    await expect(service.presence(actor, row.id, 'front_desk')).rejects.toThrow();
    expect(tx.appointment.update).not.toHaveBeenCalled();
  });
  it('requires confirmed presence before starting', async () => {
    row.presenceConfirmedAt = null;
    await expect(service.start(actor, row.id, 2)).rejects.toThrow();
    expect(tx.visit.create).not.toHaveBeenCalled();
  });
  it('rejects stale appointment revisions', async () => {
    await expect(service.start(actor, row.id, 1)).rejects.toThrow();
    expect(tx.visit.create).not.toHaveBeenCalled();
  });
  it('prevents a second active consultation using any occupied resource', async () => {
    tx.visit.findFirst.mockResolvedValue({ id: 'other-visit' });
    await expect(service.start(actor, row.id, 2)).rejects.toThrow();
    expect(tx.visit.create).not.toHaveBeenCalled();
    expect(tx.visit.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ clinicId: 'clinic', finishedAt: null, appointment: { OR: [{ doctorId: 'doctor' }, { patientId: 'patient' }, { roomId: 'room' }] } }) }));
  });
  it('treats repeated start as a read rather than creating another visit', async () => {
    row.visit = { id: 'existing' } as WorkspaceRow['visit'];
    await service.start(actor, row.id, 1);
    expect(tx.visit.create).not.toHaveBeenCalled();
  });
  it('does not finish or invoice an already finished visit twice', async () => {
    row.visit = { id: 'visit', revision: 2, finishedAt: new Date() } as WorkspaceRow['visit'];
    repo.withVisit.mockImplementation((_actor: AuthUser, _id: string, run: (db: VisitTx, current: WorkspaceRow, visit: NonNullable<WorkspaceRow['visit']>) => Promise<unknown>) => run(tx as unknown as VisitTx, row, row.visit!));
    await service.finish(actor, 'visit', 1);
    expect(tx.appointment.update).not.toHaveBeenCalled();
  });
  it('rejects a stale finish command before changing the appointment', async () => {
    row.visit = { id: 'visit', revision: 2, finishedAt: null } as WorkspaceRow['visit'];
    repo.withVisit.mockImplementation((_actor: AuthUser, _id: string, run: (db: VisitTx, current: WorkspaceRow, visit: NonNullable<WorkspaceRow['visit']>) => Promise<unknown>) => run(tx as unknown as VisitTx, row, row.visit!));
    await expect(service.finish(actor, 'visit', 1)).rejects.toThrow();
    expect(tx.appointment.update).not.toHaveBeenCalled();
  });
  it('does not allow an owner to start a clinical session as the practitioner', async () => {
    await expect(service.start({ ...actor, role: 'owner' }, row.id)).rejects.toThrow();
    expect(repo.withAppointment).not.toHaveBeenCalled();
  });
});
