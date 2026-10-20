import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  CLINICAL_FIELD_TYPE,
  TEMPLATE_STATUS,
  type ClinicalField,
  type ClinicalFieldType,
  type ClinicalTemplateInput,
  type TemplateDTO,
} from '@clinic/types';
import { ROUTES } from '@/constants/routes';
import { DEBOUNCE_MS } from '@/hooks/shared/use-debounce';
import { useLanguage } from '@/providers';
import {
  blankField,
  blankSection,
  draftToTemplateInput,
  isChoiceType,
  moveItem,
  templateProblems,
  templateToDraft,
} from '@/components/blocks/visits/note-template-form';
import {
  useArchiveClinicalNoteTemplate,
  useCloneClinicalNoteTemplate,
  useCreateClinicalNoteTemplate,
  usePublishClinicalNoteTemplate,
  useScheduleClinicalNoteTemplate,
  useSilentUpdateClinicalNoteTemplate,
  useUpdateClinicalNoteTemplate,
} from './use-clinical-note-templates';

export type BuilderSelection = { sectionId: string; fieldId?: string };

export function useNoteTemplateBuilder(template?: TemplateDTO, readOnly = false) {
  const router = useRouter();
  const { t } = useLanguage();
  const [draft, setDraft] = useState<ClinicalTemplateInput>(() => templateToDraft(template));
  const [record, setRecord] = useState(template);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [schemaDirty, setSchemaDirty] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [selected, setSelected] = useState<BuilderSelection | null>(() => template ? null : { sectionId: draft.sections[0].id });
  const timer = useRef<number | null>(null);
  const draftRef = useRef(draft);
  const recordRef = useRef(record);
  const inFlight = useRef<Promise<TemplateDTO | null> | null>(null);

  const create = useCreateClinicalNoteTemplate();
  const update = useUpdateClinicalNoteTemplate(record?.id ?? '');
  const autosave = useSilentUpdateClinicalNoteTemplate(record?.id ?? '');
  const publishMutation = usePublishClinicalNoteTemplate();
  const scheduleMutation = useScheduleClinicalNoteTemplate();
  const archiveMutation = useArchiveClinicalNoteTemplate();
  const cloneMutation = useCloneClinicalNoteTemplate();
  const locked = readOnly || record?.status === TEMPLATE_STATUS.ARCHIVED;
  const pending = create.isPending || update.isPending || autosave.isPending;

  if (!settingsDirty && !schemaDirty && template && record && template.revision > record.revision) {
    setRecord(template);
    setDraft(templateToDraft(template));
  }

  const selectedSection = draft.sections.find((section) => section.id === selected?.sectionId);
  const selectedField = selectedSection?.fields.find((field) => field.id === selected?.fieldId);

  const applySaved = (saved: TemplateDTO, snapshot: ClinicalTemplateInput) => {
    recordRef.current = saved;
    setRecord(saved);
    if (draftRef.current !== snapshot) return;
    setSettingsDirty(false);
    setSchemaDirty(false);
  };

  const persist = async (notify: boolean): Promise<TemplateDTO | null> => {
    while (inFlight.current) await inFlight.current;
    const snapshot = draftRef.current;
    const next = draftToTemplateInput(snapshot);
    const found = templateProblems(next);
    if (notify || !found.length) setProblems(found);
    if (found.length) {
      if (notify) toast.error(t.visits.templateIncomplete);
      return null;
    }
    const current = recordRef.current;
    const request = (async () => {
      try {
        const saved = current
          ? await (notify ? update : autosave).mutateAsync({ ...next, revision: current.revision })
          : await create.mutateAsync(next);
        applySaved(saved, snapshot);
        if (!current) router.push(ROUTES.NOTE_TEMPLATE(saved.id));
        return saved;
      } catch { return null; }
    })();
    inFlight.current = request;
    try { return await request; }
    finally { if (inFlight.current === request) inFlight.current = null; }
  };

  const scheduleSchemaSave = () => {
    if (!recordRef.current?.id || locked) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { void persist(false); }, DEBOUNCE_MS);
  };

  const writeDraft = (next: ClinicalTemplateInput, markDirty: (dirty: boolean) => void) => {
    if (locked) return;
    recordRef.current = record;
    setDraft(next);
    draftRef.current = next;
    markDirty(true);
    scheduleSchemaSave();
  };
  const writeSettings = (next: ClinicalTemplateInput) => writeDraft(next, setSettingsDirty);
  const writeSchema = (next: ClinicalTemplateInput) => writeDraft(next, setSchemaDirty);

  const patchSection = (sectionId: string, patch: Partial<ClinicalTemplateInput['sections'][number]>) => {
    writeSchema({
      ...draft,
      sections: draft.sections.map((section) => (section.id === sectionId ? { ...section, ...patch } : section)),
    });
  };

  const patchField = (sectionId: string, fieldId: string, patch: Partial<ClinicalField>) => {
    writeSchema({
      ...draft,
      sections: draft.sections.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              fields: section.fields.map((field) => (field.id === fieldId ? { ...field, ...patch } : field)),
            },
      ),
    });
  };

  const setType = (sectionId: string, field: ClinicalField, type: ClinicalFieldType) => {
    patchField(sectionId, field.id, {
      type,
      options: isChoiceType(type) ? field.options ?? [{ value: `${field.id}_opt`, label: '' }] : undefined,
      unit: type === CLINICAL_FIELD_TYPE.MEASUREMENT ? field.unit : undefined,
    });
  };

  const addSection = () => {
    const section = blankSection();
    writeSchema({ ...draft, sections: [...draft.sections, section] });
    setSelected({ sectionId: section.id, fieldId: section.fields[0]?.id });
  };

  const addField = (sectionId: string, type?: ClinicalFieldType, beforeFieldId?: string) => {
    const field = blankField(type);
    const section = draft.sections.find((item) => item.id === sectionId);
    if (!section) return;
    const fields = [...section.fields];
    const index = beforeFieldId ? fields.findIndex((item) => item.id === beforeFieldId) : fields.length;
    fields.splice(index < 0 ? fields.length : index, 0, field);
    patchSection(sectionId, { fields });
    setSelected({ sectionId, fieldId: field.id });
  };

  const addFromPalette = (type: ClinicalFieldType) => {
    const sectionId = selected?.sectionId ?? draft.sections.at(-1)?.id;
    if (!sectionId) {
      const section = blankSection();
      section.fields = [blankField(type)];
      writeSchema({ ...draft, sections: [section] });
      setSelected({ sectionId: section.id, fieldId: section.fields[0]?.id });
      return;
    }
    addField(sectionId, type);
  };

  const bind = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, []);

  return {
    bind,
    draft,
    record,
    locked,
    pending,
    problems,
    selected,
    selectedSection,
    selectedField,
    settingsDirty,
    schemaDirty,
    schemaSaving: autosave.isPending,
    setSelected,
    writeSettings,
    patchSection,
    patchField,
    setType,
    addSection,
    addField,
    addFromPalette,
    dropField: (sourceSectionId: string, fieldId: string, targetSectionId: string, beforeFieldId?: string) => {
      if (locked || fieldId === beforeFieldId) return;
      const source = draft.sections.find((section) => section.id === sourceSectionId);
      const destination = draft.sections.find((section) => section.id === targetSectionId);
      const field = source?.fields.find((item) => item.id === fieldId);
      if (!source || !destination || !field) return;
      if (source !== destination && (field.visibility || source.fields.some((item) => item.visibility?.fieldId === fieldId))) return;
      writeSchema({ ...draft, sections: draft.sections.map((section) => {
        const fields = section.fields.filter((item) => item.id !== fieldId);
        if (section.id !== targetSectionId) return section.id === sourceSectionId ? { ...section, fields } : section;
        const index = beforeFieldId ? fields.findIndex((item) => item.id === beforeFieldId) : fields.length;
        fields.splice(index < 0 ? fields.length : index, 0, field);
        return { ...section, fields };
      }) });
      setSelected({ sectionId: targetSectionId, fieldId });
    },
    dropSection: (sourceId: string, targetId: string) => {
      if (locked || sourceId === targetId) return;
      const section = draft.sections.find((item) => item.id === sourceId);
      if (!section) return;
      const sections = draft.sections.filter((item) => item.id !== sourceId);
      const index = sections.findIndex((item) => item.id === targetId);
      sections.splice(index < 0 ? sections.length : index, 0, section);
      writeSchema({ ...draft, sections });
    },
    moveSection: (index: number, direction: -1 | 1) =>
      writeSchema({ ...draft, sections: moveItem(draft.sections, index, direction) }),
    removeSection: (sectionId: string) => {
      writeSchema({ ...draft, sections: draft.sections.filter((section) => section.id !== sectionId) });
      if (selected?.sectionId === sectionId) setSelected(null);
    },
    moveField: (sectionId: string, index: number, direction: -1 | 1) => {
      const section = draft.sections.find((item) => item.id === sectionId);
      if (!section) return;
      patchSection(sectionId, { fields: moveItem(section.fields, index, direction) });
    },
    removeField: (sectionId: string, fieldId: string) => {
      const section = draft.sections.find((item) => item.id === sectionId);
      if (!section) return;
      patchSection(sectionId, { fields: section.fields.filter((field) => field.id !== fieldId) });
      if (selected?.fieldId === fieldId) setSelected({ sectionId });
    },
    saveSettings: () => {
      if (timer.current) window.clearTimeout(timer.current);
      recordRef.current = record;
      draftRef.current = draft;
      void persist(true);
    },
    publish: () => {
      withSavedRecord((id, revision) => publishMutation.mutate({ id, revision }));
    },
    schedule: (scheduledAt: string) => {
      withSavedRecord((id, revision) => scheduleMutation.mutate({ id, revision, scheduledAt }));
    },
    archive: () => {
      if (!record || pending) return;
      if (timer.current) window.clearTimeout(timer.current);
      archiveMutation.mutate({ id: record.id, revision: record.revision }, { onSuccess: (saved) => applySaved(saved, draft) });
    },
    clone: () => {
      if (!record) return;
      cloneMutation.mutate(record.id, {
        onSuccess: (saved) => router.push(ROUTES.NOTE_TEMPLATE(saved.id)),
      });
    },
    publishing: publishMutation.isPending || update.isPending || autosave.isPending,
    scheduling: scheduleMutation.isPending || update.isPending || autosave.isPending,
    archiving: archiveMutation.isPending,
    cloning: cloneMutation.isPending,
    cancel: () => router.push(ROUTES.NOTE_TEMPLATES),
  };

  async function withSavedRecord(run: (id: string, revision: number) => void) {
    if (!record || pending) return;
    if (timer.current) window.clearTimeout(timer.current);
    const saved = settingsDirty || schemaDirty ? await persist(true) : record;
    if (saved) run(saved.id, saved.revision);
  }
}
