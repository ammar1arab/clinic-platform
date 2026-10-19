import type { ClinicalTemplateInput, TemplateDTO } from '@clinic/types';
import { QUERY_KEYS } from '@/constants/query-keys';
import { clinicalNoteTemplatesService } from '@/services/clinical-note-templates.service';
import { useLanguage } from '@/providers';
import { useApiMutation, useFetchData, type TResponseError } from '../query';

export function useClinicalNoteTemplates(enabled = true) {
  return useFetchData<TemplateDTO[]>({
    queryKey: QUERY_KEYS.clinicalNoteTemplates.list,
    request: () => clinicalNoteTemplatesService.list(),
    options: { enabled },
  });
}

export function useClinicalNoteTemplate(id: string) {
  return useFetchData<TemplateDTO>({
    queryKey: QUERY_KEYS.clinicalNoteTemplates.detail(id),
    request: () => clinicalNoteTemplatesService.get(id),
    options: { enabled: !!id },
  });
}

export function useStarterNoteTemplate(enabled = true) {
  return useFetchData<ClinicalTemplateInput>({
    queryKey: [...QUERY_KEYS.clinicalNoteTemplates.all, 'starter'],
    request: () => clinicalNoteTemplatesService.starter(),
    options: { enabled },
  });
}

export function useMyNoteTemplates(enabled = true) {
  return useFetchData<TemplateDTO[]>({
    queryKey: [...QUERY_KEYS.clinicalNoteTemplates.all, 'mine'],
    request: () => clinicalNoteTemplatesService.available(),
    options: { enabled },
  });
}

export function useAvailableNoteTemplates(appointmentId: string) {
  return useFetchData<TemplateDTO[]>({
    queryKey: QUERY_KEYS.clinicalNoteTemplates.available(appointmentId),
    request: () => clinicalNoteTemplatesService.available(appointmentId),
    options: { enabled: !!appointmentId },
  });
}

export function useCreateClinicalNoteTemplate() {
  const { t } = useLanguage();
  return useApiMutation<TemplateDTO, TResponseError, ClinicalTemplateInput>({
    request: (body) => clinicalNoteTemplatesService.create(body),
    invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all],
    successMessage: t.visits.templateSaved,
  });
}

export function useUpdateClinicalNoteTemplate(id: string) {
  const { t } = useLanguage();
  return useApiMutation<TemplateDTO, TResponseError, ClinicalTemplateInput & { revision: number }>({
    request: (body) => clinicalNoteTemplatesService.update(id, body),
    invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all, QUERY_KEYS.clinicalNoteTemplates.detail(id)],
    successMessage: t.visits.templateSaved,
  });
}

export function useSilentUpdateClinicalNoteTemplate(id: string) {
  return useApiMutation<TemplateDTO, TResponseError, ClinicalTemplateInput & { revision: number }>({
    request: (body) => clinicalNoteTemplatesService.update(id, body),
    invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all, QUERY_KEYS.clinicalNoteTemplates.detail(id)],
  });
}

export function usePublishClinicalNoteTemplate() {
  const { t } = useLanguage();
  return useApiMutation({
    request: (input: { id: string; revision: number }) => clinicalNoteTemplatesService.publish(input.id, input.revision),
    invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all],
    successMessage: t.visits.templatePublished,
  });
}

export function useScheduleClinicalNoteTemplate() {
  const { t } = useLanguage();
  return useApiMutation({
    request: (input: { id: string; revision: number; scheduledAt: string }) =>
      clinicalNoteTemplatesService.schedule(input.id, input.revision, input.scheduledAt),
    invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all],
    successMessage: t.visits.templateScheduled,
  });
}

export function useArchiveClinicalNoteTemplate() {
  const { t } = useLanguage();
  return useApiMutation({
    request: (input: { id: string; revision: number }) => clinicalNoteTemplatesService.archive(input.id, input.revision),
    invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all],
    successMessage: t.visits.templateArchived,
  });
}

export function useCloneClinicalNoteTemplate() {
  const { t } = useLanguage();
  return useApiMutation({
    request: (id: string) => clinicalNoteTemplatesService.clone(id),
    invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all],
    successMessage: t.visits.templateCloned,
  });
}
