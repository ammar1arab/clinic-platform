'use client';

import { useState, type ReactNode } from 'react';
import { CLINICAL_FIELD_TYPE, VISIBILITY_OPERATOR, type ClinicalField, type ClinicalFieldType, type ClinicalSection, type ClinicalValue, type MedicationRow } from '@clinic/types';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui';
import { ChoiceChips, ChoiceField, DatePicker, FormField, TimePicker } from '@/components/primitives';
import { IconAdd, IconClose } from '@/constants/icons';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers';

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
        <DatePicker disabled={disabled} value={typeof value === 'string' ? value : ''} onChange={(next) => onChange(next || undefined)} />
      </FormField>
    );
  },
  [CLINICAL_FIELD_TYPE.TIME]: ({ field, value, lang, disabled, onChange }) => {
    const id = `clinical-${field.id}`;
    return (
      <FormField label={clinicalText(lang, field.label, field.labelAr)} htmlFor={id} required={field.required}>
        <TimePicker disabled={disabled} value={typeof value === 'string' ? value : ''} onChange={(next) => onChange(next || undefined)} />
      </FormField>
    );
  },
  [CLINICAL_FIELD_TYPE.SCALE]: ({ field, value, lang, disabled, onChange }) => {
    const label = clinicalText(lang, field.label, field.labelAr);
    return (
      <FormField label={label} required={field.required}>
        <ChoiceChips
          label={label}
          disabled={disabled}
          value={typeof value === 'number' ? String(value) : ''}
          options={Array.from({ length: 11 }, (_, index) => ({ value: String(index), label: String(index) }))}
          onChange={(next) => onChange(Number(next))}
        />
      </FormField>
    );
  },
  [CLINICAL_FIELD_TYPE.MEDICATIONS]: (props) => <MedicationRows {...props} />,
  [CLINICAL_FIELD_TYPE.BOOLEAN]: ({ field, value, lang, disabled, yes, no, onChange }) => (
    <FormField label={clinicalText(lang, field.label, field.labelAr)} required={field.required}>
      <ChoiceChips
        label={clinicalText(lang, field.label, field.labelAr)}
        disabled={disabled}
        value={value === true ? 'yes' : value === false ? 'no' : ''}
        options={[{ value: 'yes', label: yes }, { value: 'no', label: no }]}
        onChange={(next) => onChange(next === 'yes')}
      />
    </FormField>
  ),
  [CLINICAL_FIELD_TYPE.RADIO]: (props) => <ChoiceFields {...props} />,
  [CLINICAL_FIELD_TYPE.SELECT]: (props) => <ChoiceFields {...props} />,
  [CLINICAL_FIELD_TYPE.CHECKBOXES]: (props) => <ChoiceFields {...props} multiple />,
  [CLINICAL_FIELD_TYPE.MULTI_SELECT]: (props) => <ChoiceFields {...props} multiple />,
};

const BLANK_MEDICATION: MedicationRow = { drug: '', dose: '', frequency: '' };

function MedicationRows({ field, value, lang, disabled, onChange }: ControlProps) {
  const { t } = useLanguage();
  const rowsFromValue = () => Array.isArray(value) && value.length && typeof value[0] === 'object' ? value as MedicationRow[] : [BLANK_MEDICATION];
  const [draft, setDraft] = useState(() => ({ value, rows: rowsFromValue() }));
  if (draft.value !== value) setDraft({ value, rows: rowsFromValue() });
  const rows = draft.rows;
  const write = (next: MedicationRow[]) => {
    const filled = next.filter((row) => row.drug.trim()).map((row) => ({ drug: row.drug.trim(), dose: row.dose.trim(), frequency: row.frequency.trim() }));
    const nextValue = filled.length ? filled : undefined;
    setDraft({ value: nextValue, rows: next });
    onChange(nextValue);
  };
  const patch = (index: number, change: Partial<MedicationRow>) => write(rows.map((row, i) => (i === index ? { ...row, ...change } : row)));
  return (
    <FormField label={clinicalText(lang, field.label, field.labelAr)} required={field.required}>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <Input className="col-span-1" disabled={disabled} value={row.drug} maxLength={120} placeholder={t.visits.medDrug} aria-label={t.visits.medDrug} onChange={(event) => patch(index, { drug: event.target.value })} />
            <Button type="button" variant="ghost" size="icon" className="sm:order-last" disabled={disabled || rows.length === 1 && !row.drug} aria-label={t.common.remove} onClick={() => write(rows.length === 1 ? [BLANK_MEDICATION] : rows.filter((_, i) => i !== index))}><IconClose className="size-4" /></Button>
            <Input disabled={disabled} value={row.dose} maxLength={60} placeholder={t.visits.medDose} aria-label={t.visits.medDose} onChange={(event) => patch(index, { dose: event.target.value })} />
            <Input disabled={disabled} value={row.frequency} maxLength={60} placeholder={t.visits.medFrequency} aria-label={t.visits.medFrequency} onChange={(event) => patch(index, { frequency: event.target.value })} />
          </div>
        ))}
        {!disabled ? <Button type="button" variant="outline" size="sm" disabled={rows.length >= 30} onClick={() => setDraft({ value, rows: [...rows, BLANK_MEDICATION] })}><IconAdd className="size-4" />{t.visits.addMedication}</Button> : null}
      </div>
    </FormField>
  );
}

function ChoiceFields({ field, value, lang, disabled, onChange, multiple = false }: ControlProps & { multiple?: boolean }) {
  const label = clinicalText(lang, field.label, field.labelAr);
  const options = (field.options ?? []).map((option) => ({ value: option.value, label: clinicalText(lang, option.label, option.labelAr) }));
  return (
    <FormField label={label} required={field.required}>
      {multiple ? (
        <ChoiceField multiple label={label} disabled={disabled} options={options} value={Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []} onChange={(next) => onChange(next.length ? next : undefined)} />
      ) : (
        <ChoiceField label={label} disabled={disabled} options={options} value={typeof value === 'string' ? value : ''} onChange={onChange} />
      )}
    </FormField>
  );
}

const WIDE_FIELDS = new Set<ClinicalFieldType>([
  CLINICAL_FIELD_TYPE.TEXTAREA,
  CLINICAL_FIELD_TYPE.MEDICATIONS,
  CLINICAL_FIELD_TYPE.SCALE,
  CLINICAL_FIELD_TYPE.RADIO,
  CLINICAL_FIELD_TYPE.SELECT,
  CLINICAL_FIELD_TYPE.CHECKBOXES,
  CLINICAL_FIELD_TYPE.MULTI_SELECT,
]);

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
  const columns = !compact && sections.length > 1;

  return (
    <div className="space-y-4">
      {sections.length > 1 ? (
        <div className={cn('w-full sm:max-w-xs', !compact && 'lg:hidden')}>
          <Select value={focused?.id} onValueChange={(id) => onFocusSection?.(id)}>
            <SelectTrigger aria-label={t.visits.sections} className="h-8 w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id}>{clinicalText(lang, section.title, section.titleAr)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className={cn('space-y-6', columns && 'lg:block lg:columns-2 lg:gap-x-10 lg:space-y-0')}>
        {sections.map((section) => (
          <section
            key={section.id}
            className={cn('space-y-3', columns && 'lg:mb-6 lg:break-inside-avoid', sections.length > 1 && section.id !== focused?.id && (compact ? 'hidden' : 'hidden lg:block'))}
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold"><span aria-hidden className="h-4 w-1 rounded-full bg-primary/70" />{clinicalText(lang, section.title, section.titleAr)}</h3>
            <div className={cn('grid gap-x-4 gap-y-4 sm:grid-cols-2', columns && 'lg:grid-cols-1 xl:grid-cols-2')}>
            {section.fields.filter((field) => fieldVisible(field, values)).map((field) => {
              const render = CLINICAL_FIELD_RENDERERS[field.type];
              if (!render) return null;
              return (
                <div key={field.id} className={cn('min-w-0', WIDE_FIELDS.has(field.type) && 'sm:col-span-2')}>
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
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
