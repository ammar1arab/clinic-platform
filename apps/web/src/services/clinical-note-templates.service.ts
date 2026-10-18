import { api } from '@/lib/api';
import { ENDPOINTS } from '@/constants/endpoints';
import type { ClinicalTemplateInput, TemplateDTO, TemplateVersionDTO } from '@clinic/types';
export type { ClinicalTemplateInput };

export const clinicalNoteTemplatesService = {
  list: () => api.get<TemplateDTO[]>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.BASE).then((r) => r.data),

  get: (id: string) => api.get<TemplateDTO>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.BY_ID(id)).then((r) => r.data),

  versions: (id: string) =>
    api.get<TemplateVersionDTO[]>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.VERSIONS(id)).then((r) => r.data),

  available: (appointmentId?: string) =>
    api.get<TemplateDTO[]>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.AVAILABLE, { params: appointmentId ? { appointmentId } : {} }).then((r) => r.data),

  starter: () =>
    api.get<ClinicalTemplateInput>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.STARTER).then((r) => r.data),

  create: (body: ClinicalTemplateInput) =>
    api.post<TemplateDTO>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.BASE, body).then((r) => r.data),

  update: (id: string, body: ClinicalTemplateInput & { revision: number }) =>
    api.patch<TemplateDTO>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.BY_ID(id), body).then((r) => r.data),

  publish: (id: string, revision: number) =>
    api.post<TemplateDTO>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.PUBLISH(id), { revision }).then((r) => r.data),

  archive: (id: string, revision: number) =>
    api.post<TemplateDTO>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.ARCHIVE(id), { revision }).then((r) => r.data),

  clone: (id: string) =>
    api.post<TemplateDTO>(ENDPOINTS.CLINICAL_NOTE_TEMPLATES.CLONE(id)).then((r) => r.data),
};
