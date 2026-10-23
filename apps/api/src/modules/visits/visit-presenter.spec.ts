import { workspaceDto } from './visit-presenter';
import type { WorkspaceRow } from './visits.repository';
import type { AuthUser } from '@/modules/auth/types';
import { SEED_TEMPLATES } from './seed-templates';

const row = {
  id: 'appointment', clinicId: 'clinic', patientId: 'patient', doctorId: 'doctor',
  patient: { firstNameEn: 'Demo', lastNameEn: 'Patient', firstNameAr: null, lastNameAr: null, imageUrl: null, phone: null, dob: null, gender: null, allergies: null, bloodType: null },
  doctor: { name: 'Doctor', nameAr: null, imageUrl: null },
  clinic: { timezone: 'Asia/Amman' }, service: null, room: null, meetingUrl: null,
  scheduledAt: new Date(), durationMins: 30, status: 'completed', revision: 1,
  visit: {
    id: 'visit', revision: 1, startedAt: new Date(), finishedAt: new Date(),
    documentationDeadlineAt: new Date(Date.now() + 86400000), unlockGrantedAt: null,
    noteStatus: 'draft', reportStatus: 'draft', invoiceStatus: 'preparing',
    note: { id: 'note', templateId: 'template', sectionsSnapshot: SEED_TEMPLATES[0].sections,
      values: {}, revision: 1, authorId: 'doctor', savedAt: new Date(), signedAt: null },
    report: { id: 'report', revision: 1, sections: { reason: '', summary: '', assessment: '', plan: '', followUp: '' },
      signedAt: null, signedById: null, sourceNoteRevisionId: 'revision', reportType: 'general',
      restFrom: null, restTo: null, purpose: '', referenceNumber: 'MR-TEST' },
    invoice: null, documents: [], events: [],
  },
} as WorkspaceRow;
const actor = (role: AuthUser['role'], clinicUserId = 'owner'): AuthUser => ({ clinicId: 'clinic', userId: 'user', clinicUserId, role });

describe('clinical workspace visibility', () => {
  it('lets the owner read notes and draft reports without clinical write permissions', () => {
    const workspace = workspaceDto(row, actor('owner'));
    expect(workspace.note?.id).toBe('note');
    expect(workspace.report?.id).toBe('report');
    expect(workspace.allowedActions).toMatchObject({ editNote: false, signNote: false, editReport: false, signReport: false });
  });
  it.each(['admin', 'financial'] as const)('keeps clinical content hidden from %s', (role) => {
    expect(workspaceDto(row, actor(role))).toMatchObject({ note: null, report: null });
  });
  it('keeps the assigned practitioner clinical permissions', () => {
    const workspace = workspaceDto(row, actor('practitioner', 'doctor'));
    expect(workspace.note?.id).toBe('note');
    expect(workspace.allowedActions.editNote).toBe(true);
  });
});
