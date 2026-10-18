'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CLINICAL_FIELD_TYPE, TEMPLATE_STATUS, type ClinicalFieldType, type ClinicalTemplateInput, type TemplateDTO } from '@clinic/types';
import { Button, Input } from '@/components/ui';
import { FormField, MultiSelect } from '@/components/primitives';
import { ROUTES } from '@/constants/routes';
import { useDepartments } from '@/hooks/api/use-departments';
import { useServices } from '@/hooks/api/use-services';
import { usePractitionerDirectory } from '@/hooks/api/use-practitioners';
import { useArchiveClinicalNoteTemplate, useCloneClinicalNoteTemplate, useCreateClinicalNoteTemplate, usePublishClinicalNoteTemplate, useUpdateClinicalNoteTemplate } from '@/hooks/api/use-clinical-note-templates';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { getBilingualName } from '@/i18n';
import { useLanguage } from '@/providers';
import { ClinicalFields } from './clinical-fields';
import { blankField, clinicalId, CLINICAL_FIELD_TYPES, moveItem, starterTemplate, templateProblems, toTemplateInput } from './note-template-form';

export function NoteTemplateBuilder({ template, initial }: { template?: TemplateDTO; initial?: ClinicalTemplateInput }) {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const clinicId = useClinicId();
  const [draft, setDraft] = useState<ClinicalTemplateInput>(template ?? initial ?? starterTemplate());
  const [preview, setPreview] = useState<'desktop' | 'mobile' | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const practitioners = usePractitionerDirectory({ clinicId });
  const departments = useDepartments(clinicId);
  const services = useServices(clinicId);
  const create = useCreateClinicalNoteTemplate();
  const update = useUpdateClinicalNoteTemplate(template?.id ?? '');
  const publish = usePublishClinicalNoteTemplate();
  const archive = useArchiveClinicalNoteTemplate();
  const clone = useCloneClinicalNoteTemplate();
  const locked = template?.status === TEMPLATE_STATUS.ARCHIVED;

  const save = () => {
    const next = toTemplateInput(draft);
    const found = templateProblems(next);
    setProblems(found);
    if (found.length) return;
    if (template) {
      update.mutate({ ...next, revision: template.revision }, { onSuccess: (saved) => setDraft(saved) });
      return;
    }
    create.mutate(next, { onSuccess: (saved) => router.push(ROUTES.SETTINGS_NOTE_TEMPLATE(saved.id)) });
  };

  const patchField = (sectionId: string, fieldId: string, patch: Partial<ClinicalTemplateInput['sections'][number]['fields'][number]>) => {
    setDraft({
      ...draft,
      sections: draft.sections.map((section) => section.id === sectionId ? {
        ...section,
        fields: section.fields.map((field) => field.id === fieldId ? { ...field, ...patch } : field),
      } : section),
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={t.visits.templateName} htmlFor="template-name" required error={problems.includes('name') ? t.validation.required : undefined}>
            <Input id="template-name" value={draft.name} disabled={locked} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </FormField>
          <FormField label={t.visits.templateNameAr} htmlFor="template-name-ar">
            <Input id="template-name-ar" dir="rtl" value={draft.nameAr ?? ''} disabled={locked} onChange={(event) => setDraft({ ...draft, nameAr: event.target.value })} />
          </FormField>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.availableToAll} disabled={locked} onChange={(event) => setDraft({ ...draft, availableToAll: event.target.checked })} />
          {t.visits.availableToAll}
        </label>
        {!draft.availableToAll ? (
          <div className="grid gap-3">
            <FormField label={t.visits.practitioners}>
              <MultiSelect options={(practitioners.data ?? []).map((item) => ({ value: item.id, label: getBilingualName(item.name, item.nameAr, lang) }))} value={draft.assignments.practitionerIds} onChange={(practitionerIds) => setDraft({ ...draft, assignments: { ...draft.assignments, practitionerIds } })} />
            </FormField>
            <FormField label={t.visits.departments}>
              <MultiSelect options={(departments.data ?? []).map((item) => ({ value: item.id, label: getBilingualName(item.name, item.nameAr, lang) }))} value={draft.assignments.departmentIds} onChange={(departmentIds) => setDraft({ ...draft, assignments: { ...draft.assignments, departmentIds } })} />
            </FormField>
            <FormField label={t.visits.services}>
              <MultiSelect options={(services.data ?? []).map((item) => ({ value: item.id, label: getBilingualName(item.name, item.nameAr, lang) }))} value={draft.assignments.serviceIds} onChange={(serviceIds) => setDraft({ ...draft, assignments: { ...draft.assignments, serviceIds } })} />
            </FormField>
          </div>
        ) : null}

        {draft.sections.map((section, sectionIndex) => (
          <section key={section.id} className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex flex-wrap gap-2">
              <Input value={section.title} disabled={locked} aria-label={t.visits.sectionTitle} onChange={(event) => setDraft({ ...draft, sections: draft.sections.map((item) => item.id === section.id ? { ...item, title: event.target.value } : item) })} />
              <Input dir="rtl" value={section.titleAr ?? ''} disabled={locked} aria-label={t.visits.sectionTitleAr} onChange={(event) => setDraft({ ...draft, sections: draft.sections.map((item) => item.id === section.id ? { ...item, titleAr: event.target.value } : item) })} />
              <Button type="button" variant="outline" size="sm" disabled={locked} onClick={() => setDraft({ ...draft, sections: moveItem(draft.sections, sectionIndex, -1) })}>{t.visits.moveUp}</Button>
              <Button type="button" variant="outline" size="sm" disabled={locked} onClick={() => setDraft({ ...draft, sections: moveItem(draft.sections, sectionIndex, 1) })}>{t.visits.moveDown}</Button>
            </div>
            {section.fields.map((field, fieldIndex) => (
              <div key={field.id} className="space-y-2 rounded-lg bg-muted/40 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input value={field.label} disabled={locked} aria-label={t.visits.fieldLabel} onChange={(event) => patchField(section.id, field.id, { label: event.target.value })} />
                  <Input dir="rtl" value={field.labelAr ?? ''} disabled={locked} aria-label={t.visits.fieldLabelAr} onChange={(event) => patchField(section.id, field.id, { labelAr: event.target.value })} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
                    value={field.type}
                    disabled={locked}
                    aria-label={t.visits.fieldType}
                    onChange={(event) => patchField(section.id, field.id, { type: event.target.value as ClinicalFieldType, options: event.target.value === CLINICAL_FIELD_TYPE.SELECT || event.target.value === CLINICAL_FIELD_TYPE.MULTI_SELECT ? field.options ?? [{ value: clinicalId('opt'), label: '' }] : undefined })}
                  >
                    {CLINICAL_FIELD_TYPES.map((type) => <option key={type} value={type}>{t.visits.fieldTypes[type]}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={field.required} disabled={locked} onChange={(event) => patchField(section.id, field.id, { required: event.target.checked })} />
                    {t.visits.required}
                  </label>
                  <Button type="button" size="sm" variant="ghost" disabled={locked} onClick={() => setDraft({ ...draft, sections: draft.sections.map((item) => item.id === section.id ? { ...item, fields: moveItem(item.fields, fieldIndex, -1) } : item) })}>{t.visits.moveUp}</Button>
                  <Button type="button" size="sm" variant="ghost" disabled={locked} onClick={() => setDraft({ ...draft, sections: draft.sections.map((item) => item.id === section.id ? { ...item, fields: moveItem(item.fields, fieldIndex, 1) } : item) })}>{t.visits.moveDown}</Button>
                </div>
                {field.type === 'measurement' ? (
                  <Input value={field.unit ?? ''} disabled={locked} placeholder={t.visits.unit} onChange={(event) => patchField(section.id, field.id, { unit: event.target.value })} />
                ) : null}
                {field.type === CLINICAL_FIELD_TYPE.SELECT || field.type === CLINICAL_FIELD_TYPE.MULTI_SELECT ? (
                  <div className="space-y-2">
                    {(field.options ?? []).map((option) => (
                      <div key={option.value} className="grid gap-2 sm:grid-cols-2">
                        <Input value={option.label} disabled={locked} aria-label={t.visits.option} onChange={(event) => patchField(section.id, field.id, { options: field.options?.map((item) => item.value === option.value ? { ...item, label: event.target.value } : item) })} />
                        <Input dir="rtl" value={option.labelAr ?? ''} disabled={locked} aria-label={t.visits.optionAr} onChange={(event) => patchField(section.id, field.id, { options: field.options?.map((item) => item.value === option.value ? { ...item, labelAr: event.target.value } : item) })} />
                      </div>
                    ))}
                    <Button type="button" size="sm" variant="outline" disabled={locked} onClick={() => patchField(section.id, field.id, { options: [...(field.options ?? []), { value: clinicalId('opt'), label: '' }] })}>{t.visits.addOption}</Button>
                  </div>
                ) : null}
                <label className="block text-xs text-muted-foreground">
                  {t.visits.visibility}
                  <select
                    className="mt-1 h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm text-foreground"
                    disabled={locked}
                    value={field.visibility ? `${field.visibility.fieldId}:${field.visibility.operator}:${String(field.visibility.value)}` : ''}
                    onChange={(event) => {
                      if (!event.target.value) {
                        patchField(section.id, field.id, { visibility: undefined });
                        return;
                      }
                      const [fieldId, operator, raw] = event.target.value.split(':');
                      const value = raw === 'true' ? true : raw === 'false' ? false : raw;
                      patchField(section.id, field.id, { visibility: { fieldId, operator: operator as 'equals' | 'not_equals', value } });
                    }}
                  >
                    <option value="">{t.visits.alwaysVisible}</option>
                    {section.fields.filter((item) => item.id !== field.id && !item.visibility && item.type !== CLINICAL_FIELD_TYPE.MEASUREMENT && item.type !== CLINICAL_FIELD_TYPE.MULTI_SELECT).flatMap((item) => {
                      if (item.type === CLINICAL_FIELD_TYPE.BOOLEAN) {
                        return [true, false].map((value) => (
                          <option key={`${item.id}-${String(value)}`} value={`${item.id}:equals:${String(value)}`}>{item.label} = {String(value)}</option>
                        ));
                      }
                      return (item.options ?? []).map((option) => (
                        <option key={`${item.id}-${option.value}`} value={`${item.id}:equals:${option.value}`}>{item.label || item.id} = {option.label || option.value}</option>
                      ));
                    })}
                  </select>
                </label>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" disabled={locked} onClick={() => setDraft({ ...draft, sections: draft.sections.map((item) => item.id === section.id ? { ...item, fields: [...item.fields, blankField()] } : item) })}>{t.visits.addField}</Button>
          </section>
        ))}
        <Button type="button" variant="outline" disabled={locked} onClick={() => setDraft({ ...draft, sections: [...draft.sections, { id: clinicalId('section'), title: '', fields: [blankField()] }] })}>{t.visits.addSection}</Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={locked || create.isPending || update.isPending} onClick={save}>{t.common.save}</Button>
          <Button type="button" variant="outline" onClick={() => setPreview(preview === 'mobile' ? 'desktop' : 'mobile')}>{preview === 'mobile' ? t.visits.previewDesktop : t.visits.previewMobile}</Button>
          {template && template.status !== TEMPLATE_STATUS.ARCHIVED ? (
            <Button type="button" variant="outline" disabled={publish.isPending} onClick={() => publish.mutate({ id: template.id, revision: template.revision })}>{t.visits.publish}</Button>
          ) : null}
          {template && template.status !== TEMPLATE_STATUS.ARCHIVED ? (
            <Button type="button" variant="outline" disabled={archive.isPending} onClick={() => archive.mutate({ id: template.id, revision: template.revision })}>{t.visits.archive}</Button>
          ) : null}
          {template ? <Button type="button" variant="outline" disabled={clone.isPending} onClick={() => clone.mutate(template.id, { onSuccess: (saved) => router.push(ROUTES.SETTINGS_NOTE_TEMPLATE(saved.id)) })}>{t.visits.clone}</Button> : null}
        </div>
        {template ? <p className="text-xs text-muted-foreground">{t.visits.version.replace('{version}', String(template.version))} · {t.visits.templateStatuses[template.status]}</p> : null}
      </div>
      <aside className={preview === 'mobile' ? 'mx-auto w-full max-w-sm' : 'w-full'}>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-xs text-muted-foreground">{preview === 'mobile' ? t.visits.previewMobile : t.visits.previewDesktop}</p>
          <ClinicalFields sections={draft.sections.filter((section) => section.title && section.fields.some((field) => field.label))} values={{}} lang={lang} disabled />
        </div>
      </aside>
    </div>
  );
}
