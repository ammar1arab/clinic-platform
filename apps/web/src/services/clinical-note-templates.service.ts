import { api } from '@/lib/api';
import { ENDPOINTS } from '@/constants/endpoints';
import type { ClinicalTemplateInput, NotePreference, TemplateDTO } from '@clinic/types';
export type { ClinicalTemplateInput };

export const clinicalNoteTemplatesService = {
  clinicDefault: () => api.get<NotePreference>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.DEFAULT).then((r) => r.data),
  setClinicDefault: (templateId: string) => api.put<NotePreference>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.DEFAULT, { templateId }).then((r) => r.data),
  list: () => api.get<TemplateDTO[]>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.BASE).then((r) => r.data),

  get: (id: string) => api.get<TemplateDTO>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.BY_ID(id)).then((r) => r.data),

  available: (appointmentId?: string) =>
    api.get<TemplateDTO[]>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.AVAILABLE, { params: appointmentId ? { appointmentId } : {} }).then((r) => r.data),

  starters: () => api.get<ClinicalTemplateInput[]>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.STARTERS).then((r) => r.data),

  create: (body: ClinicalTemplateInput) =>
    api.post<TemplateDTO>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.BASE, body).then((r) => r.data),

  update: (id: string, body: ClinicalTemplateInput & { revision: number }) =>
    api.patch<TemplateDTO>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.BY_ID(id), body).then((r) => r.data),

  publish: (id: string, revision: number) =>
    api.post<TemplateDTO>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.PUBLISH(id), { revision }).then((r) => r.data),

  schedule: (id: string, revision: number, scheduledAt: string) =>
    api.post<TemplateDTO>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.SCHEDULE(id), { revision, scheduledAt }).then((r) => r.data),

  archive: (id: string, revision: number) =>
    api.post<TemplateDTO>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.ARCHIVE(id), { revision }).then((r) => r.data),

  remove: (id: string) =>
    api.delete(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.BY_ID(id)).then((r) => r.data),

  clone: (id: string) =>
    api.post<TemplateDTO>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.CLONE(id)).then((r) => r.data),
};
