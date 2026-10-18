'use client';

import { CLINICAL_FIELD_TYPE, type ClinicalField, type ClinicalSection, type ClinicalValue } from '@clinic/types';
import { Input, Textarea } from '@/components/ui';
import { FormField, MultiSelect } from '@/components/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers';

export function clinicalText(lang: string, label: string, labelAr?: string | null) {
  return lang === 'ar' && labelAr?.trim() ? labelAr : label;
}

export function fieldVisible(field: ClinicalField, values: Record<string, ClinicalValue>) {
  const rule = field.visibility;
  if (!rule) return true;
  const current = values[rule.fieldId];
  return rule.operator === 'equals' ? current === rule.value : current !== rule.value;
}

export function ClinicalFields({
  sections,
  values,
  lang,
  disabled,
  focusedId,
  onFocusSection,
  onChange,
}: {
  sections: ClinicalSection[];
  values: Record<string, ClinicalValue>;
  lang: string;
  disabled?: boolean;
  focusedId?: string;
  onFocusSection?: (id: string) => void;
  onChange?: (fieldId: string, value: ClinicalValue | undefined) => void;
}) {
  const focused = sections.find((section) => section.id === focusedId) ?? sections[0];

  return (
    <div className="space-y-4">
      {sections.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
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
            className={cn('space-y-4', sections.length > 1 && section.id !== focused?.id && 'hidden lg:block')}
          >
            <h3 className="text-sm font-semibold">{clinicalText(lang, section.title, section.titleAr)}</h3>
            {section.fields.filter((field) => fieldVisible(field, values)).map((field) => (
              <ClinicalControl
                key={field.id}
                field={field}
                lang={lang}
                disabled={disabled}
                value={values[field.id]}
                onChange={(value) => onChange?.(field.id, value)}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function ClinicalControl({
  field,
  value,
  lang,
  disabled,
  onChange,
}: {
  field: ClinicalField;
  value: ClinicalValue | undefined;
  lang: string;
  disabled?: boolean;
  onChange: (value: ClinicalValue | undefined) => void;
}) {
  const { t } = useLanguage();
  const label = clinicalText(lang, field.label, field.labelAr);
  const id = `clinical-${field.id}`;

  if (field.type === CLINICAL_FIELD_TYPE.TEXTAREA) {
    return (
      <FormField label={label} htmlFor={id} required={field.required}>
        <Textarea
          id={id}
          disabled={disabled}
          value={typeof value === 'string' ? value : ''}
          rows={8}
          className="min-h-48 text-base leading-relaxed lg:min-h-36"
          onChange={(event) => onChange(event.target.value || undefined)}
        />
      </FormField>
    );
  }

  if (field.type === CLINICAL_FIELD_TYPE.TEXT) {
    return (
      <FormField label={label} htmlFor={id} required={field.required}>
        <Input id={id} disabled={disabled} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value || undefined)} />
      </FormField>
    );
  }

  if (field.type === CLINICAL_FIELD_TYPE.NUMBER) {
    return (
      <FormField label={label} htmlFor={id} required={field.required}>
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
  }

  if (field.type === CLINICAL_FIELD_TYPE.MEASUREMENT) {
    const current = value && typeof value === 'object' && 'value' in value ? value.value : '';
    return (
      <FormField label={label} htmlFor={id} required={field.required}>
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
  }

  if (field.type === CLINICAL_FIELD_TYPE.DATE) {
    return (
      <FormField label={label} htmlFor={id} required={field.required}>
        <Input id={id} type="date" disabled={disabled} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value || undefined)} />
      </FormField>
    );
  }

  if (field.type === CLINICAL_FIELD_TYPE.BOOLEAN) {
    return (
      <FormField label={label} required={field.required}>
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
              {option ? t.visits.yes : t.visits.no}
            </button>
          ))}
        </div>
      </FormField>
    );
  }

  if (field.type === CLINICAL_FIELD_TYPE.SELECT) {
    return (
      <FormField label={label} required={field.required}>
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
  }

  return (
    <FormField label={label} required={field.required}>
      <MultiSelect
        options={(field.options ?? []).map((option) => ({ value: option.value, label: clinicalText(lang, option.label, option.labelAr) }))}
        value={Array.isArray(value) ? value : []}
        disabled={disabled}
        onChange={(next) => onChange(next.length ? next : undefined)}
      />
    </FormField>
  );
}
