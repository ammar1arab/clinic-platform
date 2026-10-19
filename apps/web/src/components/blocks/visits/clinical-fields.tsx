'use client';

import type { ReactNode } from 'react';
import { CLINICAL_FIELD_TYPE, VISIBILITY_OPERATOR, type ClinicalField, type ClinicalFieldType, type ClinicalSection, type ClinicalValue } from '@clinic/types';
import { Input, Textarea } from '@/components/ui';
import { FormField, MultiSelect } from '@/components/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers';
import { MEDICAL_NOTE_PALETTE } from './note-template-form';

export function clinicalText(lang: string, label: string, labelAr?: string | null) {
  return lang === 'ar' && labelAr?.trim() ? labelAr : label;
}

export function fieldVisible(field: ClinicalField, values: Record<string, ClinicalValue>) {
  const rule = field.visibility;
  if (!rule) return true;
  const current = values[rule.fieldId];
  return rule.operator === VISIBILITY_OPERATOR.EQUALS ? current === rule.value : current !== rule.value;
}

type ControlProps = {
  field: ClinicalField;
  value: ClinicalValue | undefined;
  lang: string;
  disabled?: boolean;
  yes: string;
  no: string;
  onChange: (value: ClinicalValue | undefined) => void;
};

const CLINICAL_FIELD_RENDERERS: Record<ClinicalFieldType, (props: ControlProps) => ReactNode> = {
  [CLINICAL_FIELD_TYPE.TEXT]: ({ field, value, lang, disabled, onChange }) => {
    const id = `clinical-${field.id}`;
    return (
      <FormField label={clinicalText(lang, field.label, field.labelAr)} htmlFor={id} required={field.required}>
        <Input id={id} disabled={disabled} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value || undefined)} />
      </FormField>
    );
  },
  [CLINICAL_FIELD_TYPE.TEXTAREA]: ({ field, value, lang, disabled, onChange }) => {
    const id = `clinical-${field.id}`;
    return (
      <FormField label={clinicalText(lang, field.label, field.labelAr)} htmlFor={id} required={field.required}>
        <Textarea
          id={id}
          disabled={disabled}
          value={typeof value === 'string' ? value : ''}
          rows={4}
          className="field-sizing-content min-h-28 max-h-[min(32rem,60dvh)] text-base leading-relaxed"
          onChange={(event) => onChange(event.target.value || undefined)}
        />
      </FormField>
    );
  },
  [CLINICAL_FIELD_TYPE.NUMBER]: ({ field, value, lang, disabled, onChange }) => {
    const id = `clinical-${field.id}`;
    return (
      <FormField label={clinicalText(lang, field.label, field.labelAr)} htmlFor={id} required={field.required}>
        <Input
          id={id}
          type="number"
          disabled={disabled}
          value={typeof value === 'number' ? value : ''}
          min={field.min}
          max={field.max}
          onChange={(event) => onChange(event.target.value === '' ? undefined : Number(event.target.value))}
        />
      </FormField>
    );
  },
  [CLINICAL_FIELD_TYPE.MEASUREMENT]: ({ field, value, lang, disabled, onChange }) => {
    const id = `clinical-${field.id}`;
    const current = value && typeof value === 'object' && 'value' in value ? value.value : '';
    return (
      <FormField label={clinicalText(lang, field.label, field.labelAr)} htmlFor={id} required={field.required}>
        <div className="flex items-center gap-2">
          <Input
            id={id}
            type="number"
            disabled={disabled}
            value={current}
            min={field.min}
            max={field.max}
            onChange={(event) => {
              if (event.target.value === '' || !field.unit) {
                onChange(undefined);
                return;
              }
              onChange({ value: Number(event.target.value), unit: field.unit });
            }}
          />
          <span className="shrink-0 text-sm text-muted-foreground">{field.unit}</span>
        </div>
      </FormField>
    );
  },
  [CLINICAL_FIELD_TYPE.DATE]: ({ field, value, lang, disabled, onChange }) => {
    const id = `clinical-${field.id}`;
    return (
      <FormField label={clinicalText(lang, field.label, field.labelAr)} htmlFor={id} required={field.required}>
        <Input id={id} type="date" disabled={disabled} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value || undefined)} />
      </FormField>
    );
  },
  [CLINICAL_FIELD_TYPE.BOOLEAN]: ({ field, value, lang, disabled, yes, no, onChange }) => (
    <FormField label={clinicalText(lang, field.label, field.labelAr)} required={field.required}>
      <div className="flex gap-2">
        {[true, false].map((option) => (
          <button
            key={String(option)}
            type="button"
            disabled={disabled}
            aria-pressed={value === option}
            onClick={() => onChange(value === option ? undefined : option)}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm',
              value === option ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
            )}
          >
            {option ? yes : no}
          </button>
        ))}
      </div>
    </FormField>
  ),
  [CLINICAL_FIELD_TYPE.SELECT]: ({ field, value, lang, disabled, onChange }) => {
    const id = `clinical-${field.id}`;
    return (
      <FormField label={clinicalText(lang, field.label, field.labelAr)} required={field.required}>
        <Select value={typeof value === 'string' ? value : ''} onValueChange={(next) => onChange(next)} disabled={disabled}>
          <SelectTrigger id={id}><SelectValue /></SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {clinicalText(lang, option.label, option.labelAr)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    );
  },
  [CLINICAL_FIELD_TYPE.RADIO]: (props) => <ChoiceFields {...props} />,
  [CLINICAL_FIELD_TYPE.CHECKBOXES]: (props) => <ChoiceFields {...props} multiple />,
  [CLINICAL_FIELD_TYPE.MULTI_SELECT]: ({ field, value, lang, disabled, onChange }) => (
    <FormField label={clinicalText(lang, field.label, field.labelAr)} required={field.required}>
      <MultiSelect
        options={(field.options ?? []).map((option) => ({ value: option.value, label: clinicalText(lang, option.label, option.labelAr) }))}
        value={Array.isArray(value) ? value : []}
        disabled={disabled}
        onChange={(next) => onChange(next.length ? next : undefined)}
      />
    </FormField>
  ),
};

function ChoiceFields({ field, value, lang, disabled, onChange, multiple = false }: ControlProps & { multiple?: boolean }) {
  const selected = Array.isArray(value) ? value : [];
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-2">
      <legend className="mb-2 text-sm font-medium">{clinicalText(lang, field.label, field.labelAr)}{field.required ? <span className="ms-1 text-destructive">*</span> : null}</legend>
      {(field.options ?? []).map((option) => (
        <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 text-sm has-checked:border-primary has-checked:bg-primary/5">
          <input type={multiple ? 'checkbox' : 'radio'} name={`clinical-${field.id}`} value={option.value}
            checked={multiple ? selected.includes(option.value) : value === option.value}
            className="size-4 shrink-0 accent-primary"
            onChange={() => {
              if (!multiple) { onChange(option.value); return; }
              const next = selected.includes(option.value) ? selected.filter((item) => item !== option.value) : [...selected, option.value];
              onChange(next.length ? next : undefined);
            }} />
          <span>{clinicalText(lang, option.label, option.labelAr)}</span>
        </label>
      ))}
    </fieldset>
  );
}

const registered = new Set<ClinicalFieldType>(MEDICAL_NOTE_PALETTE);

export function ClinicalFields({
  sections,
  values,
  lang,
  disabled,
  focusedId,
  onFocusSection,
  onChange,
  compact = false,
}: {
  compact?: boolean;
  sections: ClinicalSection[];
  values: Record<string, ClinicalValue>;
  lang: string;
  disabled?: boolean;
  focusedId?: string;
  onFocusSection?: (id: string) => void;
  onChange?: (fieldId: string, value: ClinicalValue | undefined) => void;
}) {
  const { t } = useLanguage();
  const focused = sections.find((section) => section.id === focusedId) ?? sections[0];

  return (
    <div className="space-y-4">
      {sections.length > 1 ? (
        <div className={cn('flex gap-2 overflow-x-auto pb-1', !compact && 'lg:hidden')}>
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onFocusSection?.(section.id)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm',
                section.id === focused?.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground',
              )}
            >
              {clinicalText(lang, section.title, section.titleAr)}
            </button>
          ))}
        </div>
      ) : null}
      <div className="space-y-8">
        {sections.map((section) => (
          <section
            key={section.id}
            className={cn('space-y-4', sections.length > 1 && section.id !== focused?.id && (compact ? 'hidden' : 'hidden lg:block'))}
          >
            <h3 className="text-sm font-semibold">{clinicalText(lang, section.title, section.titleAr)}</h3>
            {section.fields.filter((field) => fieldVisible(field, values)).map((field) => {
              const render = registered.has(field.type) ? CLINICAL_FIELD_RENDERERS[field.type] : undefined;
              if (!render) return null;
              return (
                <div key={field.id}>
                  {render({
                    field,
                    lang,
                    disabled,
                    value: values[field.id],
                    yes: t.visits.yes,
                    no: t.visits.no,
                    onChange: (value) => onChange?.(field.id, value),
                  })}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
