import type { ClinicalTemplateInput, TemplateDTO } from '@clinic/types';
import { QUERY_KEYS } from '@/constants/query-keys';
import { clinicalNoteTemplatesService } from '@/services/clinical-note-templates.service';
import { useLanguage } from '@/providers';
import { useApiMutation, useFetchData, type TResponseError } from '../query';
import { errorText } from '../query/query-normalize';

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
    invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all, QUERY_KEYS.notePreference],
    successMessage: t.visits.templateSaved,
    errorMessage: errorText,
  });
}

export function useUpdateClinicalNoteTemplate(id: string) {
  const { t } = useLanguage();
  return useApiMutation<TemplateDTO, TResponseError, ClinicalTemplateInput & { revision: number }>({
    request: (body) => clinicalNoteTemplatesService.update(id, body),
    invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all, QUERY_KEYS.clinicalNoteTemplates.detail(id)],
    successMessage: t.visits.templateSaved,
    errorMessage: errorText,
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
    invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all, QUERY_KEYS.notePreference],
    successMessage: t.visits.templatePublished,
    errorMessage: errorText,
  });
}

export function useArchiveClinicalNoteTemplate() {
  const { t } = useLanguage();
  return useApiMutation({
    request: (input: { id: string; revision: number }) => clinicalNoteTemplatesService.archive(input.id, input.revision),
    invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all, QUERY_KEYS.notePreference],
    successMessage: t.visits.templateArchived,
    errorMessage: errorText,
  });
}

export function useDeleteClinicalNoteTemplate() {
  const { t } = useLanguage();
  return useApiMutation({
    request: (id: string) => clinicalNoteTemplatesService.remove(id),
    invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all, QUERY_KEYS.notePreference],
    successMessage: t.visits.templateDeleted,
    errorMessage: errorText,
  });
}

export function useDraftClinicalNoteTemplate() {
  const { t } = useLanguage();
  return useApiMutation({
    request: (input: { id: string; revision: number }) => clinicalNoteTemplatesService.draft(input.id, input.revision),
    invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all, QUERY_KEYS.notePreference],
    successMessage: t.visits.templateSaved,
    errorMessage: errorText,
  });
}

export function useRestoreClinicalNoteTemplate() {
  const { t } = useLanguage();
  return useApiMutation({
    request: (input: { id: string; revision: number }) => clinicalNoteTemplatesService.restore(input.id, input.revision),
    invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all, QUERY_KEYS.notePreference],
    successMessage: t.visits.templateRestored,
    errorMessage: errorText,
  });
}

export function useCloneClinicalNoteTemplate() {
  const { t } = useLanguage();
  return useApiMutation({
    request: (id: string) => clinicalNoteTemplatesService.clone(id),
    invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all, QUERY_KEYS.notePreference],
    successMessage: t.visits.templateCloned,
  });
}

export function useClinicNoteDefault() {
  return useFetchData({ queryKey: [...QUERY_KEYS.clinicalNoteTemplates.all, 'default'], request: () => clinicalNoteTemplatesService.clinicDefault() });
}
export function useSetClinicNoteDefault() {
  return useApiMutation({ request: (templateId: string) => clinicalNoteTemplatesService.setClinicDefault(templateId), invalidateQueries: [QUERY_KEYS.clinicalNoteTemplates.all, QUERY_KEYS.notePreference], errorMessage: errorText });
}

export function useStarterNoteTemplates() {
  return useFetchData({ queryKey: [...QUERY_KEYS.clinicalNoteTemplates.all, 'starters'], request: () => clinicalNoteTemplatesService.starters() });
}
