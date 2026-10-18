import { CLINICAL_FIELD_TYPE, type ClinicalField, type ClinicalSection, type ClinicalTemplateInput } from '@clinic/types';

export const CLINICAL_FIELD_TYPES = Object.values(CLINICAL_FIELD_TYPE);

export function clinicalId(prefix: string) {
  const raw = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
  return `${prefix}_${raw.replace(/-/g, '').slice(0, 12)}`;
}

export function starterTemplate(): ClinicalTemplateInput {
  return {
    name: '',
    nameAr: '',
    availableToAll: true,
    assignments: { practitionerIds: [], departmentIds: [], serviceIds: [] },
    sections: [{
      id: 'visit',
      title: 'Visit',
      titleAr: 'الزيارة',
      fields: [
        { id: 'reason', label: 'Reason for visit', labelAr: 'سبب الزيارة', type: 'textarea', required: false },
        { id: 'summary', label: 'Summary', labelAr: 'الخلاصة', type: 'textarea', required: false },
        { id: 'assessment', label: 'Assessment', labelAr: 'التقييم', type: 'textarea', required: false },
        { id: 'plan', label: 'Plan', labelAr: 'الخطة', type: 'textarea', required: false },
        { id: 'followUp', label: 'Follow-up', labelAr: 'المتابعة', type: 'textarea', required: false },
      ],
    }],
  };
}

export function blankField(): ClinicalField {
  return { id: clinicalId('field'), label: '', type: 'textarea', required: false };
}

export function toTemplateInput(input: ClinicalTemplateInput): ClinicalTemplateInput {
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
  if (field.type === 'number' || field.type === 'measurement') {
    if (typeof field.min === 'number' && Number.isFinite(field.min)) next.min = field.min;
    if (typeof field.max === 'number' && Number.isFinite(field.max)) next.max = field.max;
  }
  if (field.type === 'measurement' && field.unit?.trim()) next.unit = field.unit.trim();
  if (field.type === CLINICAL_FIELD_TYPE.SELECT || field.type === CLINICAL_FIELD_TYPE.MULTI_SELECT) {
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
      if (field.type === 'measurement' && !field.unit?.trim()) problems.push(`${field.id}-unit`);
      if ((field.type === CLINICAL_FIELD_TYPE.SELECT || field.type === CLINICAL_FIELD_TYPE.MULTI_SELECT) && !(field.options ?? []).some((option) => option.label.trim() && option.value.trim())) {
        problems.push(`${field.id}-options`);
      }
    }
  }
  return problems;
}

export type { ClinicalSection };
