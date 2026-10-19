import {
  CLINICAL_FIELD_TYPE,
  FORM_FIELD_TYPE,
  type ClinicalField,
  type ClinicalFieldType,
  type ClinicalSection,
  type ClinicalTemplateInput,
  type FormFieldType,
  type TemplateDTO,
} from '@clinic/types';

export const MEDICAL_NOTE_PALETTE = [
  FORM_FIELD_TYPE.TEXT,
  FORM_FIELD_TYPE.TEXTAREA,
  FORM_FIELD_TYPE.NUMBER,
  FORM_FIELD_TYPE.RADIO,
  FORM_FIELD_TYPE.CHECKBOXES,
  FORM_FIELD_TYPE.SELECT,
  FORM_FIELD_TYPE.MULTI_SELECT,
  FORM_FIELD_TYPE.BOOLEAN,
  FORM_FIELD_TYPE.DATE,
  FORM_FIELD_TYPE.MEASUREMENT,
] as const satisfies readonly FormFieldType[];

export const CLINICAL_FIELD_TYPES = MEDICAL_NOTE_PALETTE;

const choiceTypes = new Set<ClinicalFieldType>([
  CLINICAL_FIELD_TYPE.RADIO,
  CLINICAL_FIELD_TYPE.CHECKBOXES,
  CLINICAL_FIELD_TYPE.SELECT,
  CLINICAL_FIELD_TYPE.MULTI_SELECT,
]);

export function isChoiceType(type: ClinicalFieldType) {
  return choiceTypes.has(type);
}

export function clinicalId(prefix: string) {
  const raw = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
  return `${prefix}_${raw.replace(/-/g, '').slice(0, 12)}`;
}

export function blankTemplate(): ClinicalTemplateInput {
  return {
    name: '',
    nameAr: '',
    availableToAll: true,
    assignments: { practitionerIds: [], departmentIds: [], serviceIds: [] },
    sections: [blankSection()],
  };
}

export function blankField(type: ClinicalFieldType = CLINICAL_FIELD_TYPE.TEXTAREA): ClinicalField {
  return {
    id: clinicalId('field'),
    label: '',
    type,
    required: false,
    ...(isChoiceType(type) ? { options: [{ value: clinicalId('opt'), label: '' }] } : {}),
    ...(type === CLINICAL_FIELD_TYPE.MEASUREMENT ? { unit: '' } : {}),
  };
}

export function blankSection(): ClinicalSection {
  return { id: clinicalId('section'), title: '', fields: [blankField()] };
}

export function templateToDraft(source?: TemplateDTO | ClinicalTemplateInput): ClinicalTemplateInput {
  if (!source) return blankTemplate();
  return {
    name: source.name,
    nameAr: source.nameAr ?? '',
    availableToAll: source.availableToAll,
    assignments: {
      practitionerIds: [...source.assignments.practitionerIds],
      departmentIds: [...source.assignments.departmentIds],
      serviceIds: [...source.assignments.serviceIds],
    },
    sections: source.sections.map((section) => ({
      id: section.id,
      title: section.title,
      ...(section.titleAr ? { titleAr: section.titleAr } : {}),
      fields: section.fields.map((field) => ({
        ...field,
        options: field.options?.map((option) => ({ ...option })),
      })),
    })),
  };
}

export function draftToTemplateInput(input: ClinicalTemplateInput): ClinicalTemplateInput {
  return {
    name: input.name.trim(),
    ...(input.nameAr?.trim() ? { nameAr: input.nameAr.trim() } : {}),
    availableToAll: input.availableToAll,
    assignments: input.assignments,
    sections: input.sections.map((section) => ({
      id: section.id,
      title: section.title.trim(),
      ...(section.titleAr?.trim() ? { titleAr: section.titleAr.trim() } : {}),
      fields: section.fields.map(cleanField),
    })),
  };
}

function cleanField(field: ClinicalField): ClinicalField {
  const next: ClinicalField = {
    id: field.id,
    label: field.label.trim(),
    type: field.type,
    required: field.required,
    ...(field.labelAr?.trim() ? { labelAr: field.labelAr.trim() } : {}),
  };
  if (field.type === CLINICAL_FIELD_TYPE.NUMBER || field.type === CLINICAL_FIELD_TYPE.MEASUREMENT) {
    if (typeof field.min === 'number' && Number.isFinite(field.min)) next.min = field.min;
    if (typeof field.max === 'number' && Number.isFinite(field.max)) next.max = field.max;
  }
  if (field.type === CLINICAL_FIELD_TYPE.MEASUREMENT && field.unit?.trim()) next.unit = field.unit.trim();
  if (isChoiceType(field.type)) {
    next.options = (field.options ?? []).map((option) => ({
      value: option.value,
      label: option.label.trim(),
      ...(option.labelAr?.trim() ? { labelAr: option.labelAr.trim() } : {}),
    }));
  }
  if (field.visibility?.fieldId) next.visibility = field.visibility;
  return next;
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = items.slice();
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

export function templateProblems(input: ClinicalTemplateInput): string[] {
  const problems: string[] = [];
  if (!input.name.trim()) problems.push('name');
  if (!input.sections.length) problems.push('sections');
  const ids = new Set<string>();
  for (const section of input.sections) {
    if (!section.title.trim() || ids.has(section.id)) problems.push(section.id);
    ids.add(section.id);
    if (!section.fields.length) problems.push(`${section.id}-fields`);
    for (const field of section.fields) {
      if (!field.label.trim() || ids.has(field.id)) problems.push(field.id);
      ids.add(field.id);
      if (field.min !== undefined && field.max !== undefined && field.min > field.max) problems.push(`${field.id}-range`);
      if (field.type === CLINICAL_FIELD_TYPE.MEASUREMENT && !field.unit?.trim()) problems.push(`${field.id}-unit`);
      if (isChoiceType(field.type) && (!(field.options ?? []).length || (field.options ?? []).some((option) => !option.label.trim() || !option.value.trim()))) {
        problems.push(`${field.id}-options`);
      }
    }
  }
  return problems;
}

export function previewSections(draft: ClinicalTemplateInput) {
  return draft.sections
    .filter((section) => section.title || section.fields.some((field) => field.label))
    .map((section) => ({ ...section, fields: section.fields.filter((field) => field.label) }));
}

export type { ClinicalSection };
