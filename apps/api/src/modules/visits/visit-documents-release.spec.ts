import { Prisma } from '@prisma/client';
import { VisitsService } from './visits.service';
import type { VisitRow, VisitsRepository, VisitTx, WorkspaceRow } from './visits.repository';
import type { TemplatesService } from './templates.service';
import type { VisitDocumentsService } from './visit-documents.service';
import type { DashboardGateway } from '@/modules/dashboard/dashboard.gateway';
import type { NotificationsService } from '@/modules/notifications/notifications.service';
import type { AuthUser } from '@/modules/auth/types';

jest.mock('./visit-presenter', () => ({
  workspaceDto: (row: { visit: { report: unknown } }) => ({ report: row.visit.report }),
  invoiceDto: () => ({ paid: '0.000' }),
  noteLocked: () => false,
}));

const owner: AuthUser = { clinicId: 'clinic', clinicUserId: 'owner', userId: 'user', role: 'owner' };
const doctor: AuthUser = { ...owner, clinicUserId: 'doctor', role: 'practitioner' };
const document = (id: string, kind: string, revision: number) => ({ id, kind, revision, signedAt: new Date(), releasedAt: null });

describe('Visit document release rules', () => {
  const tx = {
    visitDocument: { create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    visitMedicalReport: { update: jest.fn() },
    visitInvoice: { update: jest.fn() },
    visit: { update: jest.fn() },
    visitEvent: { create: jest.fn() },
  };
  let visit: VisitRow;
  let row: WorkspaceRow;
  const repo = {
    db: { visitDocument: { findFirst: jest.fn() } },
    withVisit: jest.fn(),
    appointment: jest.fn(),
  };
  const service = new VisitsService(
    repo as unknown as VisitsRepository,
    {} as TemplatesService,
    { render: jest.fn().mockResolvedValue(Buffer.from('pdf')) } as unknown as VisitDocumentsService,
    { emitAppointmentChanged: jest.fn(), emitVisitChanged: jest.fn() } as unknown as DashboardGateway,
    {} as NotificationsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    tx.visitEvent.create.mockResolvedValue({ id: 'event' });
    visit = {
      id: 'visit',
      context: { clinicName: 'Clinic', patientName: 'Patient', practitionerName: 'Doctor', timezone: 'UTC' },
      note: { signedAt: new Date() },
      report: { id: 'report', revision: 3, signedAt: new Date(), sections: { reason: 'r', summary: 's', assessment: '', plan: 'p', followUp: '' } },
      invoice: { id: 'invoice', revision: 4, issuedAt: new Date(), voidedAt: null, prepayment: new Prisma.Decimal(0), payments: [] },
      documents: [document('report-1', 'medical_report', 1), document('report-2', 'medical_report', 3), document('invoice-1', 'invoice', 2)],
    } as unknown as VisitRow;
    row = { id: 'appointment', clinic: {}, visit } as unknown as WorkspaceRow;
    repo.db.visitDocument.findFirst.mockResolvedValue({ visitId: 'visit' });
    repo.withVisit.mockImplementation((_actor: AuthUser, _id: string, run: (db: VisitTx, current: WorkspaceRow, current_visit: VisitRow) => Promise<unknown>) =>
      run(tx as unknown as VisitTx, row, visit),
    );
    repo.appointment.mockImplementation(async () => row);
  });

  it('withdraws earlier medical report versions when the report is amended', async () => {
    await service.signReport(doctor, 'visit', 3, { revision: 3, reason: 'Corrected plan', sections: { reason: 'r', summary: 's', assessment: '', plan: 'new plan', followUp: '' } });
    expect(tx.visitDocument.updateMany).toHaveBeenCalledWith({
      where: { visitId: 'visit', kind: 'medical_report', revision: { lt: 4 } },
      data: { releasedAt: null },
    });
  });

  it('withdraws invoice documents when the invoice is voided', async () => {
    await service.voidInvoice(owner, 'visit', 4, 'Issued in error');
    expect(tx.visitDocument.updateMany).toHaveBeenCalledWith({
      where: { visitId: 'visit', kind: 'invoice' },
      data: { releasedAt: null },
    });
  });

  it('releases the latest version of a document', async () => {
    await service.releaseDocument(owner, 'report-2', true, 'Patient request');
    expect(tx.visitDocument.update).toHaveBeenCalledWith({ where: { id: 'report-2' }, data: { releasedAt: expect.any(Date) } });
  });

  it('refuses to release a superseded version', async () => {
    await expect(service.releaseDocument(owner, 'report-1', true, 'Patient request')).rejects.toThrow();
    expect(tx.visitDocument.update).not.toHaveBeenCalled();
  });

  it('refuses to release a voided invoice', async () => {
    (visit.invoice as { voidedAt: Date | null }).voidedAt = new Date();
    await expect(service.releaseDocument(owner, 'invoice-1', true, 'Patient request')).rejects.toThrow();
    expect(tx.visitDocument.update).not.toHaveBeenCalled();
  });

  it('still allows withdrawing a superseded version', async () => {
    await service.releaseDocument(owner, 'report-1', false, 'Cleanup');
    expect(tx.visitDocument.update).toHaveBeenCalledWith({ where: { id: 'report-1' }, data: { releasedAt: null } });
  });
});
