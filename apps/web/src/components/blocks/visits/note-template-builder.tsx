'use client';

import { useState } from 'react';
import { CLINICAL_FIELD_TYPE, TEMPLATE_STATUS, type ClinicalField, type ClinicalValue, type ClinicalSection, type TemplateDTO } from '@clinic/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import {
  BilingualNameFields,
  DatePicker,
  EmptyState,
  FormField,
  MultiSelect,
  OverflowActions,
  PageBack,
  RowActionsMenu,
  SelectionToggle,
  SidePanel,
  SoftTip,
  DragItem,
} from '@/components/primitives';
import { ROUTES } from '@/constants/routes';
import { TEMPLATE_STATUS_VARIANT } from '@/constants/status';
import { IconFieldText, IconFieldParagraph, IconFieldNumber, IconFieldSelect, IconFieldMultiSelect, IconFieldBoolean, IconFieldMeasurement, IconCalendar, IconGrip, IconAdd, IconArrowDown, IconArrowUp, IconDelete, IconFileText, IconArchive, IconCopy, IconClose, IconCheck, IconFilters, IconSettings } from '@/constants/icons';
import { useDepartments } from '@/hooks/api/use-departments';
import { useServices } from '@/hooks/api/use-services';
import { usePractitionerDirectory } from '@/hooks/api/use-practitioners';
import { useNoteTemplateBuilder } from '@/hooks/api/use-note-template-builder';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { getBilingualName } from '@/i18n';
import { useLanguage } from '@/providers';
import { cn } from '@/lib/utils';
import { ClinicalFields } from './clinical-fields';
import { MEDICAL_NOTE_PALETTE, clinicalId, isChoiceType, previewSections } from './note-template-form';

export function NoteTemplateBuilder({ template }: { template?: TemplateDTO }) {
  const { lang, t } = useLanguage();
  const clinicId = useClinicId();
  const { bind, ...builder } = useNoteTemplateBuilder(template);
  const practitioners = usePractitionerDirectory({ clinicId });
  const departments = useDepartments(clinicId);
  const services = useServices(clinicId);
  const { draft, record, locked, selected, selectedField, selectedSection } = builder;
  const status = record?.status ?? TEMPLATE_STATUS.DRAFT;
  const statusVariant = TEMPLATE_STATUS_VARIANT[status];
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduling, setScheduling] = useState(false);

  return (
    <Tabs ref={bind} defaultValue="settings" className="page-fill gap-2">
      <PageBack
        backHref={ROUTES.SETTINGS_NOTE_TEMPLATES}
        search={
          <div className="hidden md:block">
            <OverflowActions label={t.visits.builderSettings}>
              <BuilderTabsList variant="pill" />
            </OverflowActions>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
            {builder.schemaSaving ? <span role="status" className="text-xs text-muted-foreground">{t.visits.saving}</span> : null}
            {!record ? (
              <Button type="button" size="sm" disabled={builder.pending} onClick={builder.saveSettings}>{t.common.save}</Button>
            ) : (
              <>
                <Select
                  value={status}
                  disabled={locked || builder.publishing || builder.archiving}
                  onValueChange={(value) => {
                    if (value === TEMPLATE_STATUS.PUBLISHED) { setScheduling(false); builder.publish(); }
                    else if (value === TEMPLATE_STATUS.SCHEDULED) setScheduling(true);
                    else if (value === TEMPLATE_STATUS.ARCHIVED) { setScheduling(false); builder.archive(); }
                  }}
                >
                  <SelectTrigger size="sm" className="h-7 w-auto gap-1 border-transparent bg-transparent px-1.5 sm:h-8 sm:gap-1.5 sm:px-2">
                    <Badge variant={statusVariant}><SelectValue /></Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {([TEMPLATE_STATUS.DRAFT, TEMPLATE_STATUS.PUBLISHED, TEMPLATE_STATUS.SCHEDULED, TEMPLATE_STATUS.ARCHIVED] as const).map((value) => (
                      <SelectItem key={value} value={value} disabled={value === TEMPLATE_STATUS.DRAFT}>{t.visits.templateStatuses[value]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {scheduling ? (
                  <>
                    <DatePicker value={scheduleDate} onChange={setScheduleDate} placeholder={t.visits.schedulePlaceholder} fromDate={new Date()} className="h-7 w-auto sm:h-8" />
                    <SoftTip label={t.visits.scheduleConfirm}>
                      <Button type="button" size="icon" variant="outline" className="size-7 sm:size-8" disabled={builder.scheduling || !scheduleDate} aria-label={t.visits.scheduleConfirm} onClick={() => { builder.schedule(new Date(`${scheduleDate}T00:00:00`).toISOString()); setScheduling(false); }}>
                        <IconCheck className="size-4" />
                      </Button>
                    </SoftTip>
                    <SoftTip label={t.common.close}>
                      <Button type="button" size="icon" variant="ghost" className="size-7 sm:size-8" aria-label={t.common.close} onClick={() => setScheduling(false)}>
                        <IconClose className="size-4" />
                      </Button>
                    </SoftTip>
                  </>
                ) : null}
                {status !== TEMPLATE_STATUS.ARCHIVED ? (
                  <SoftTip label={t.visits.archive}>
                    <Button type="button" size="icon" variant="ghost" className="size-7 sm:size-8" disabled={builder.archiving} aria-label={t.visits.archive} onClick={builder.archive}>
                      <IconArchive className="size-4" />
                    </Button>
                  </SoftTip>
                ) : null}
                <SoftTip label={t.visits.clone}>
                  <Button type="button" size="icon" variant="ghost" className="size-7 sm:size-8" disabled={builder.cloning} aria-label={t.visits.clone} onClick={builder.clone}>
                    <IconCopy className="size-4" />
                  </Button>
                </SoftTip>
              </>
            )}
          </div>
        }
      />

      <div className="md:hidden">
        <BuilderTabsList variant="fill" />
      </div>

      <TabsContent value="settings" className="min-h-0 space-y-4 overflow-y-auto p-1">
        <Card className="overflow-visible">
          <CardHeader className="space-y-1">
            <p className="text-sm font-semibold">{t.visits.template}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <BilingualNameFields
              name={draft.name}
              nameAr={draft.nameAr ?? ''}
              onNameChange={(name) => builder.writeSettings({ ...draft, name })}
              onNameArChange={(nameAr) => builder.writeSettings({ ...draft, nameAr })}
              englishError={builder.problems.includes('name') ? t.validation.required : undefined}
              maxLength={80}
            />
            <label className="flex items-center gap-2 text-sm font-medium">
              <SelectionToggle label={t.visits.availableToAll} checked={draft.availableToAll} disabled={locked} onChange={(availableToAll) => builder.writeSettings({ ...draft, availableToAll })} />
              {t.visits.availableToAll}
            </label>
            {!draft.availableToAll ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <FormField label={t.visits.practitioners}>
                  <MultiSelect options={(practitioners.data ?? []).map((item) => ({ value: item.id, label: getBilingualName(item.name, item.nameAr, lang) }))} value={draft.assignments.practitionerIds} onChange={(practitionerIds) => builder.writeSettings({ ...draft, assignments: { ...draft.assignments, practitionerIds } })} />
                </FormField>
                <FormField label={t.visits.departments}>
                  <MultiSelect options={(departments.data ?? []).map((item) => ({ value: item.id, label: getBilingualName(item.name, item.nameAr, lang) }))} value={draft.assignments.departmentIds} onChange={(departmentIds) => builder.writeSettings({ ...draft, assignments: { ...draft.assignments, departmentIds } })} />
                </FormField>
                <FormField label={t.visits.services}>
                  <MultiSelect options={(services.data ?? []).map((item) => ({ value: item.id, label: getBilingualName(item.name, item.nameAr, lang) }))} value={draft.assignments.serviceIds} onChange={(serviceIds) => builder.writeSettings({ ...draft, assignments: { ...draft.assignments, serviceIds } })} />
                </FormField>
              </div>
            ) : null}
          </CardContent>
        </Card>
        {builder.problems.includes('sections') ? <p className="text-sm text-destructive">{t.visits.emptyCanvas}</p> : null}
      </TabsContent>

      <TabsContent value="build" className="flex min-h-0 flex-col gap-4">
        <PaletteStrip locked={locked} onPick={builder.addFromPalette} onDrop={(type, target) => builder.addField(target.split('|')[0], type, target.split('|')[1])} />
        <div data-drag-scope className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-1 md:overflow-hidden md:grid-cols-[minmax(10rem,0.9fr)_minmax(0,2.2fr)_minmax(10rem,0.9fr)] lg:grid-cols-[minmax(12rem,0.85fr)_minmax(0,2.8fr)_minmax(12rem,0.85fr)] xl:grid-cols-[minmax(14rem,0.8fr)_minmax(0,2.8fr)_minmax(14rem,0.8fr)]">
          <SidePanel title={t.visits.palette} className="hidden md:flex" contentClassName="grid content-start gap-2">
            <PaletteItems locked={locked} onPick={builder.addFromPalette} onDrop={(type, target) => builder.addField(target.split('|')[0], type, target.split('|')[1])} />
          </SidePanel>

          <Card className="min-h-0 min-w-0 overflow-visible">
            <CardHeader className="shrink-0 gap-1"><p className="text-sm font-semibold">{t.visits.canvas}</p><p className="text-xs text-muted-foreground">{t.visits.canvasHint}</p></CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-1 pb-2">
            {!draft.sections.length ? (
              <EmptyState icon={IconFileText} title={t.visits.emptyCanvas} description={t.visits.emptyCanvasCta} action={<Button type="button" disabled={locked} onClick={builder.addSection}><IconAdd className="size-4" />{t.visits.addSection}</Button>} />
            ) : null}
            {draft.sections.map((section, sectionIndex) => (
              <Card key={section.id} data-drop-target={section.id} className={cn('group/drop overflow-visible transition-[border-color,background-color] duration-200 motion-reduce:transition-none data-[drag-over=true]:bg-primary/5 data-[drag-over=true]:ring-2 data-[drag-over=true]:ring-primary', selected?.sectionId === section.id && !selected.fieldId && 'ring-1 ring-primary')}>
                <CardHeader className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-3 px-4">
                  <DragItem label={t.visits.section} variant="ghost" className="size-9 shrink-0 justify-center p-0" disabled={locked} onDrop={(target) => builder.dropSection(section.id, target.split('|')[0])}>
                    <IconGrip className="size-4" />
                  </DragItem>
                  <div className="grid min-w-0 flex-1 gap-2 xl:grid-cols-2">
                    <FormField label={t.visits.section} htmlFor={`${section.id}-title`} required>
                      <Input id={`${section.id}-title`} value={section.title} disabled={locked} onFocus={() => builder.setSelected({ sectionId: section.id })} onChange={(event) => builder.patchSection(section.id, { title: event.target.value })} />
                    </FormField>
                    <FormField label={t.visits.sectionTitleAr} htmlFor={`${section.id}-title-ar`}>
                      <Input id={`${section.id}-title-ar`} dir="rtl" value={section.titleAr ?? ''} disabled={locked} onFocus={() => builder.setSelected({ sectionId: section.id })} onChange={(event) => builder.patchSection(section.id, { titleAr: event.target.value })} />
                    </FormField>
                  </div>
                  <RowActionsMenu
                    items={[
                      { label: t.visits.moveUp, icon: IconArrowUp, disabled: locked || sectionIndex === 0, onSelect: () => builder.moveSection(sectionIndex, -1) },
                      { label: t.visits.moveDown, icon: IconArrowDown, disabled: locked || sectionIndex === draft.sections.length - 1, onSelect: () => builder.moveSection(sectionIndex, 1) },
                      { label: t.common.remove, icon: IconDelete, variant: 'destructive', disabled: locked, onSelect: () => builder.removeSection(section.id) },
                    ]}
                  />
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-1">
                  {!section.fields.length ? <p role="alert" className="text-xs text-destructive">{t.visits.emptySection}</p> : null}
                  {section.fields.map((field) => (
                    <div key={field.id} data-drop-target={`${section.id}|${field.id}`} className="flex items-center gap-2 rounded-lg data-[drag-over=true]:bg-primary/10 data-[drag-over=true]:ring-2 data-[drag-over=true]:ring-primary">
                      <DragItem label={field.label || t.visits.field} variant="ghost" className="size-9 shrink-0 justify-center p-0" disabled={locked} onDrop={(target) => builder.dropField(section.id, field.id, target.split('|')[0], target.split('|')[1])}>
                        <IconGrip className="size-4 text-muted-foreground" />
                      </DragItem>
                      <button type="button" onClick={() => builder.setSelected({ sectionId: section.id, fieldId: field.id })} className={cn('flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border px-3 py-3 text-start text-sm transition-colors motion-reduce:transition-none', selected?.fieldId === field.id ? 'border-primary bg-primary/5' : 'border-border bg-muted/30')}>
                        <span className="min-w-0 truncate">{field.label || t.visits.field}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{t.visits.fieldTypes[field.type]}</span>
                      </button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" disabled={locked} onClick={() => builder.addField(section.id)}>
                    <IconAdd className="size-4" />{t.visits.addField}
                  </Button>
                </CardContent>
              </Card>
            ))}
            {draft.sections.length ? (
              <Button type="button" variant="outline" disabled={locked} onClick={builder.addSection}>
                <IconAdd className="size-4" />{t.visits.addSection}
              </Button>
            ) : null}
            </CardContent>
          </Card>

          <SidePanel
            title={<span className="flex items-center gap-2"><IconSettings className="size-4 text-muted-foreground" />{t.visits.fieldSettings}</span>}
            description={t.visits.fieldSettingsHint}
            className="border-dashed bg-muted/30"
            mobileSheet
            open={!!selectedField}
            onClose={() => builder.setSelected(selectedSection ? { sectionId: selectedSection.id } : null)}
          >
            {selectedField && selectedSection ? (
              <FieldSettings
                field={selectedField}
                siblings={selectedSection.fields}
                locked={locked}
                problems={builder.problems}
                onPatch={(patch) => builder.patchField(selectedSection.id, selectedField.id, patch)}
                onType={(type) => builder.setType(selectedSection.id, selectedField, type)}
                onMove={(direction) => {
                  const index = selectedSection.fields.findIndex((item) => item.id === selectedField.id);
                  builder.moveField(selectedSection.id, index, direction);
                }}
                onRemove={() => builder.removeField(selectedSection.id, selectedField.id)}
                canMoveUp={selectedSection.fields[0]?.id !== selectedField.id}
                canMoveDown={selectedSection.fields.at(-1)?.id !== selectedField.id}
              />
            ) : (
              <EmptyState icon={IconFilters} title={t.visits.selectField} size="compact" />
            )}
          </SidePanel>
        </div>
      </TabsContent>

      <TabsContent value="publish" className="min-h-0 space-y-4 overflow-y-auto p-1">
        <TemplatePreview key={JSON.stringify(previewSections(draft))} sections={previewSections(draft)} title={getBilingualName(draft.name, draft.nameAr, lang)} />
        {record ? <p className="text-xs text-muted-foreground">{t.visits.version.replace('{version}', String(record.version))}</p> : null}
        {record?.status === TEMPLATE_STATUS.SCHEDULED && record.scheduledAt ? (
          <p className="text-xs text-muted-foreground">{t.visits.scheduleAt} {new Date(record.scheduledAt).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}</p>
        ) : null}
      </TabsContent>
    </Tabs>
  );
}

function BuilderTabsList({ variant }: { variant: 'pill' | 'fill' }) {
  const { t } = useLanguage();
  return (
    <TabsList variant={variant} className={variant === 'pill' ? 'mx-auto' : undefined}>
      <TabsTrigger value="settings">{t.visits.builderSettings}</TabsTrigger>
      <TabsTrigger value="build">{t.visits.builderBuild}</TabsTrigger>
      <TabsTrigger value="publish">{t.visits.builderPublish}</TabsTrigger>
    </TabsList>
  );
}

function TemplatePreview({ sections, title }: { sections: ClinicalSection[]; title: string }) {
  const { lang, t } = useLanguage();
  const [values, setValues] = useState<Record<string, ClinicalValue>>({});
  const [focusedId, setFocusedId] = useState(sections[0]?.id ?? '');
  return (
    <Card className="overflow-visible">
      <CardHeader>
        <p className="text-sm font-semibold">{title || t.visits.preview}</p>
      </CardHeader>
      <CardContent>
        <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="mx-auto min-w-0 space-y-4">
          {sections.length ? <ClinicalFields sections={sections} values={values} lang={lang} focusedId={focusedId} onFocusSection={setFocusedId} onChange={(id, value) => setValues((current) => { const next = { ...current }; if (value === undefined) delete next[id]; else next[id] = value; return next; })} /> : <EmptyState icon={IconFileText} title={t.visits.previewIncomplete} />}
        </div>
      </CardContent>
    </Card>
  );
}

function PaletteStrip({ locked, onPick, onDrop }: { locked: boolean; onPick: (type: ClinicalField['type']) => void; onDrop: (type: ClinicalField['type'], target: string) => void }) {
  const { t } = useLanguage();
  return (
    <div className="shrink-0 md:hidden">
      <OverflowActions label={t.visits.palette}>
        <PaletteItems locked={locked} onPick={onPick} onDrop={onDrop} compact />
      </OverflowActions>
    </div>
  );
}

const FIELD_ICONS = {
  text: IconFieldText,
  textarea: IconFieldParagraph,
  number: IconFieldNumber,
  radio: IconFieldSelect,
  checkboxes: IconFieldMultiSelect,
  select: IconFieldSelect,
  multi_select: IconFieldMultiSelect,
  boolean: IconFieldBoolean,
  date: IconCalendar,
  measurement: IconFieldMeasurement,
};

function PaletteItems({ locked, onPick, onDrop, compact = false }: {
  locked: boolean;
  onPick: (type: ClinicalField['type']) => void;
  onDrop: (type: ClinicalField['type'], target: string) => void;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  return MEDICAL_NOTE_PALETTE.map((type) => {
    const Icon = FIELD_ICONS[type];
    return <div key={type} className={cn('group/palette flex min-w-0 items-center rounded-xl border border-border/50 bg-muted/20 hover:border-primary/40 hover:bg-primary/5', compact ? 'shrink-0' : 'w-full')}>
      <Button type="button" variant="ghost" disabled={locked} onClick={() => onPick(type)} className={cn('h-auto min-w-0 flex-1 justify-start gap-2 rounded-xl text-start font-normal', compact ? 'min-h-9 px-2.5 py-1.5' : 'min-h-12 px-3 py-3')}>
        <span className={cn('grid shrink-0 place-items-center rounded-lg bg-background text-muted-foreground group-hover/palette:text-primary', compact ? 'size-6' : 'size-7')}><Icon className={compact ? 'size-3.5' : 'size-4'} aria-hidden /></span>
        <span className={cn('min-w-0 flex-1 leading-snug', compact ? 'whitespace-nowrap text-xs' : 'whitespace-normal text-sm')}>{t.visits.fieldTypes[type]}</span>
      </Button>
      <DragItem label={t.visits.fieldTypes[type]} disabled={locked} variant="ghost" className="me-1 size-8 shrink-0 justify-center gap-0 p-0" onDrop={(target) => onDrop(type, target)}>
        <IconGrip className="size-3.5 text-muted-foreground" />
      </DragItem>
    </div>;
  });
}

function FieldSettings({
  field,
  siblings,
  locked,
  problems,
  onPatch,
  onType,
  onMove,
  onRemove,
  canMoveUp,
  canMoveDown,
}: {
  field: ClinicalField;
  siblings: ClinicalField[];
  locked: boolean;
  problems: string[];
  onPatch: (patch: Partial<ClinicalField>) => void;
  onType: (type: ClinicalField['type']) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <SelectionToggle label={t.visits.required} checked={field.required} disabled={locked} onChange={(required) => onPatch({ required })} />
          {t.visits.required}
        </label>
        <RowActionsMenu
          items={[
            { label: t.visits.moveUp, icon: IconArrowUp, disabled: locked || !canMoveUp, onSelect: () => onMove(-1) },
            { label: t.visits.moveDown, icon: IconArrowDown, disabled: locked || !canMoveDown, onSelect: () => onMove(1) },
            { label: t.common.remove, icon: IconDelete, variant: 'destructive', disabled: locked || siblings.length === 1, onSelect: onRemove },
          ]}
        />
      </div>
      <FormField label={t.visits.field} htmlFor={`${field.id}-label`} required error={problems.includes(field.id) ? t.validation.required : undefined}>
        <Input id={`${field.id}-label`} value={field.label} disabled={locked} onChange={(event) => onPatch({ label: event.target.value })} />
      </FormField>
      <FormField label={t.visits.fieldLabelAr} htmlFor={`${field.id}-label-ar`}>
        <Input id={`${field.id}-label-ar`} dir="rtl" value={field.labelAr ?? ''} disabled={locked} onChange={(event) => onPatch({ labelAr: event.target.value })} />
      </FormField>
      <FormField label={t.visits.fieldType}>
        <Select value={field.type} disabled={locked} onValueChange={(type) => onType(type as ClinicalField['type'])}>
          <SelectTrigger aria-label={t.visits.fieldType}><SelectValue /></SelectTrigger>
          <SelectContent>
            {MEDICAL_NOTE_PALETTE.map((type) => <SelectItem key={type} value={type}>{t.visits.fieldTypes[type]}</SelectItem>)}
          </SelectContent>
        </Select>
      </FormField>
      {field.type === CLINICAL_FIELD_TYPE.NUMBER || field.type === CLINICAL_FIELD_TYPE.MEASUREMENT ? (
        <div className="grid grid-cols-2 gap-2">
          <FormField label={t.visits.minimum} error={problems.includes(`${field.id}-range`) ? t.visits.invalidRange : undefined}>
            <Input type="number" step="any" value={field.min ?? ''} disabled={locked} onChange={(event) => onPatch({ min: event.target.value === '' ? undefined : Number(event.target.value) })} />
          </FormField>
          <FormField label={t.visits.maximum}>
            <Input type="number" step="any" value={field.max ?? ''} disabled={locked} onChange={(event) => onPatch({ max: event.target.value === '' ? undefined : Number(event.target.value) })} />
          </FormField>
        </div>
      ) : null}
      {field.type === CLINICAL_FIELD_TYPE.MEASUREMENT ? (
        <FormField label={t.visits.unit} required error={problems.includes(`${field.id}-unit`) ? t.validation.required : undefined}>
          <Input value={field.unit ?? ''} disabled={locked} onChange={(event) => onPatch({ unit: event.target.value })} />
        </FormField>
      ) : null}
      {isChoiceType(field.type) ? (
        <div className="space-y-2">
          {(field.options ?? []).map((option) => (
            <div key={option.value} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <Input value={option.label} disabled={locked} placeholder={t.visits.option} aria-label={t.visits.option} onChange={(event) => onPatch({ options: field.options?.map((item) => item.value === option.value ? { ...item, label: event.target.value } : item) })} />
              <Button type="button" variant="ghost" size="icon" disabled={locked || (field.options?.length ?? 0) <= 1} aria-label={t.common.remove} onClick={() => onPatch({ options: field.options?.filter((item) => item.value !== option.value) })}><IconDelete className="size-4" /></Button>
              <Input dir="rtl" value={option.labelAr ?? ''} disabled={locked} placeholder={t.visits.optionAr} aria-label={t.visits.optionAr} onChange={(event) => onPatch({ options: field.options?.map((item) => item.value === option.value ? { ...item, labelAr: event.target.value } : item) })} />
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" disabled={locked} onClick={() => onPatch({ options: [...(field.options ?? []), { value: clinicalId('opt'), label: '' }] })}>
            <IconAdd className="size-4" />{t.visits.addOption}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
