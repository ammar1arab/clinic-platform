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
  EmptyState,
  ChoiceField,
  FormField,
  OptionList,
  OverflowActions,
  PageBack,
  RowActionsMenu,
  SelectionToggle,
  SidePanel,
  SoftTip,
  TargetAudience,
  DragItem,
} from '@/components/primitives';
import { ROUTES } from '@/constants/routes';
import { TEMPLATE_STATUS_VARIANT } from '@/constants/status';
import { IconFieldText, IconFieldParagraph, IconFieldNumber, IconFieldSelect, IconFieldMultiSelect, IconFieldBoolean, IconFieldMeasurement, IconFieldScale, IconFieldMedication, IconTime, IconCalendar, IconGrip, IconAdd, IconArrowDown, IconArrowUp, IconDelete, IconFileText, IconCopy, IconFilters, IconArchive, IconRotateCcw, IconSend, type LucideIcon } from '@/constants/icons';
import { useDepartments } from '@/hooks/api/use-departments';
import { useServices } from '@/hooks/api/use-services';
import { usePractitionerDirectory } from '@/hooks/api/use-practitioners';
import { useNoteTemplateBuilder } from '@/hooks/api/use-note-template-builder';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { getBilingualName } from '@/i18n';
import { useLanguage } from '@/providers';
import { cn } from '@/lib/utils';
import { ClinicalFields } from './clinical-fields';
import { AUDIENCE_ASSIGNMENT, MEDICAL_NOTE_PALETTE, TEMPLATE_AUDIENCE, clinicalId, isChoiceType, previewSections, type TemplateAudience } from './note-template-form';

type PickKind = Exclude<TemplateAudience, typeof TEMPLATE_AUDIENCE.ALL>;

export function NoteTemplateBuilder({ template, readOnly = false }: { template?: TemplateDTO; readOnly?: boolean }) {
  const { lang, t } = useLanguage();
  const clinicId = useClinicId();
  const { bind, ...builder } = useNoteTemplateBuilder(template, readOnly);
  const practitioners = usePractitionerDirectory({ clinicId });
  const departments = useDepartments(clinicId);
  const services = useServices(clinicId);
  const { draft, record, locked, selected, selectedField, selectedSection } = builder;
  const status = record?.status ?? TEMPLATE_STATUS.DRAFT;
  const statusVariant = TEMPLATE_STATUS_VARIANT[status];
  const [pickKind, setPickKind] = useState<PickKind>(TEMPLATE_AUDIENCE.PRACTITIONERS);
  const audienceLabel = {
    [TEMPLATE_AUDIENCE.DEPARTMENTS]: t.visits.departments,
    [TEMPLATE_AUDIENCE.SERVICES]: t.visits.services,
    [TEMPLATE_AUDIENCE.PRACTITIONERS]: t.visits.practitioners,
  } as const;
  const audienceSource = {
    [TEMPLATE_AUDIENCE.DEPARTMENTS]: (departments.data ?? []).map((item) => ({ value: item.id, label: getBilingualName(item.name, item.nameAr, lang) })),
    [TEMPLATE_AUDIENCE.SERVICES]: (services.data ?? []).map((item) => ({ value: item.id, label: getBilingualName(item.name, item.nameAr, lang) })),
    [TEMPLATE_AUDIENCE.PRACTITIONERS]: (practitioners.data ?? []).map((item) => ({ value: item.id, label: getBilingualName(item.name, item.nameAr, lang) })),
  } as const;
  const audienceLoading = {
    [TEMPLATE_AUDIENCE.DEPARTMENTS]: departments.isLoading,
    [TEMPLATE_AUDIENCE.SERVICES]: services.isLoading,
    [TEMPLATE_AUDIENCE.PRACTITIONERS]: practitioners.isLoading,
  } as const;
  const pickedGroups = (Object.keys(AUDIENCE_ASSIGNMENT) as PickKind[])
    .map((kind) => ({ kind, ids: draft.assignments[AUDIENCE_ASSIGNMENT[kind]] }))
    .filter((group) => group.ids.length);
  const audienceSummary = pickedGroups.length === 0
    ? t.ui.select
    : pickedGroups
        .map((group) => group.ids.length === 1
          ? audienceSource[group.kind].find((option) => option.value === group.ids[0])?.label ?? `1 ${audienceLabel[group.kind]}`
          : `${group.ids.length} ${audienceLabel[group.kind]}`)
        .join(' · ');

  return (
    <Tabs ref={bind} defaultValue={readOnly ? 'publish' : 'settings'} className="page-fill-always flex-1 gap-2">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <PageBack backHref={ROUTES.NOTE_TEMPLATES} />
        <div className="hidden md:block">
          <OverflowActions label={t.visits.builderSettings}>
            <BuilderTabsList variant="pill" />
          </OverflowActions>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-1 sm:gap-2 max-md:justify-self-end">
          {!record ? (
            <Button type="button" size="sm" disabled={builder.pending} onClick={builder.saveSettings}>{t.common.save}</Button>
          ) : (
            <>
              <Badge variant={statusVariant}>{t.visits.templateStatuses[status]}</Badge>
              {readOnly || builder.isDefault ? null : status === TEMPLATE_STATUS.ARCHIVED ? (
                <IconAction label={t.visits.restoreTemplate} icon={IconRotateCcw} disabled={builder.pending} onClick={builder.restore} />
              ) : (
                <IconAction label={t.visits.archive} icon={IconArchive} disabled={builder.pending || locked} onClick={builder.archive} />
              )}
              <IconAction label={t.visits.clone} icon={IconCopy} disabled={builder.cloning} onClick={builder.clone} />
              {readOnly || builder.isDefault || status === TEMPLATE_STATUS.ARCHIVED ? null : (
                <IconAction label={t.visits.publish} icon={IconSend} variant="default" disabled={builder.pending || locked} onClick={builder.publish} />
              )}
            </>
          )}
        </div>
      </div>

      <div className="md:hidden">
        <BuilderTabsList variant="fill" />
      </div>

      <TabsContent value="settings" className="flex min-h-0 flex-col gap-4 overflow-y-auto p-1">
        <Card className="min-w-0 flex-1 shrink-0 overflow-visible">
          <CardHeader className="space-y-1">
            <p className="text-sm font-semibold">{t.visits.template}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {builder.isDefault ? <p className="text-xs leading-relaxed text-muted-foreground">{t.visits.defaultTemplateRule}</p> : null}
            <fieldset disabled={locked} className="min-w-0 border-0 p-0">
            <BilingualNameFields
              name={draft.name}
              nameAr={draft.nameAr ?? ''}
              onNameChange={(name) => builder.writeSettings({ ...draft, name })}
              onNameArChange={(nameAr) => builder.writeSettings({ ...draft, nameAr })}
              englishError={builder.problems.includes('name') ? t.validation.required : undefined}
              maxLength={80}
            />
            </fieldset>
            <TargetAudience
              everyoneLabel={t.visits.audienceAll}
              specificLabel={t.common.audienceSpecific}
              specific={!draft.availableToAll}
              onSpecificChange={(specific) => builder.writeSettings({ ...draft, availableToAll: !specific })}
              summary={audienceSummary}
              disabled={locked || builder.isDefault}
              error={builder.problems.includes('assignments') ? t.visits.audienceRequired : undefined}
            >
              <ChoiceField
                label={t.common.targetAudience}
                value={pickKind}
                options={[
                  { value: TEMPLATE_AUDIENCE.PRACTITIONERS, label: t.visits.practitioners },
                  { value: TEMPLATE_AUDIENCE.DEPARTMENTS, label: t.visits.departments },
                  { value: TEMPLATE_AUDIENCE.SERVICES, label: t.visits.services },
                ]}
                onChange={(next) => setPickKind(next as PickKind)}
              />
              <OptionList
                multiple
                label={audienceLabel[pickKind]}
                loading={audienceLoading[pickKind]}
                options={audienceSource[pickKind]}
                value={draft.assignments[AUDIENCE_ASSIGNMENT[pickKind]]}
                onChange={(ids) => builder.writeSettings({ ...draft, assignments: { ...draft.assignments, [AUDIENCE_ASSIGNMENT[pickKind]]: ids } })}
              />
            </TargetAudience>
          </CardContent>
        </Card>
        {builder.problems.includes('sections') ? <p className="text-sm text-destructive">{t.visits.emptyCanvas}</p> : null}
      </TabsContent>

      <TabsContent value="build" className="flex min-h-0 flex-col gap-4">
        <PaletteStrip locked={locked} onPick={builder.addFromPalette} onDrop={(type, target) => builder.addField(target.split('|')[0], type, target.split('|')[1])} />
        <div data-drag-scope className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-1 md:overflow-hidden md:grid-cols-[minmax(10rem,1fr)_minmax(0,2.4fr)_minmax(10rem,1fr)] lg:grid-cols-[minmax(12rem,1fr)_minmax(0,3fr)_minmax(12rem,1fr)] xl:grid-cols-[minmax(14rem,1fr)_minmax(0,3fr)_minmax(14rem,1fr)] [&>*]:min-w-0">
          <SidePanel title={t.visits.palette} className="hidden md:flex" contentClassName="grid content-start gap-1.5">
            <PaletteItems locked={locked} onPick={builder.addFromPalette} onDrop={(type, target) => builder.addField(target.split('|')[0], type, target.split('|')[1])} />
          </SidePanel>

          <Card size="sm" className="min-h-0 min-w-0 overflow-visible">
            <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
            {!draft.sections.length ? (
              <EmptyState framed={false} icon={IconFileText} title={t.visits.emptyCanvas} description={t.visits.emptyCanvasCta} action={<Button type="button" disabled={locked} onClick={builder.addSection}><IconAdd className="size-4" />{t.visits.addSection}</Button>} />
            ) : null}
            {draft.sections.map((section, sectionIndex) => (
              <Card key={section.id} data-drop-target={section.id} className={cn('group/drop overflow-visible transition-[border-color,background-color] duration-200 motion-reduce:transition-none data-[drag-over=true]:bg-primary/5', selected?.sectionId === section.id && !selected.fieldId && 'ring-1 ring-primary')}>
                <CardHeader className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 px-4">
                  <DragItem label={t.visits.section} variant="ghost" className="size-8 shrink-0 justify-center p-0" disabled={locked} onDrop={(target) => builder.dropSection(section.id, target.split('|')[0])}>
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
                  <div>
                  <RowActionsMenu
                    items={[
                      { label: t.visits.moveUp, icon: IconArrowUp, disabled: locked || sectionIndex === 0, onSelect: () => builder.moveSection(sectionIndex, -1) },
                      { label: t.visits.moveDown, icon: IconArrowDown, disabled: locked || sectionIndex === draft.sections.length - 1, onSelect: () => builder.moveSection(sectionIndex, 1) },
                      { label: t.common.remove, icon: IconDelete, variant: 'destructive', disabled: locked, onSelect: () => builder.removeSection(section.id) },
                    ]}
                  />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-1">
                  {!section.fields.length ? <p role="alert" className="text-xs text-destructive">{t.visits.emptySection}</p> : null}
                  {section.fields.map((field) => (
                    <div key={field.id} data-drop-target={`${section.id}|${field.id}`} className="flex items-center gap-2 rounded-lg data-[drag-over=true]:shadow-[inset_0_2px_0_var(--color-primary)]">
                      <DragItem label={field.label || t.visits.field} variant="ghost" disabled={locked}
                        onPick={() => builder.setSelected({ sectionId: section.id, fieldId: field.id })}
                        onDrop={(target) => builder.dropField(section.id, field.id, target.split('|')[0], target.split('|')[1])}
                        className={cn('h-auto w-full min-w-0 justify-start rounded-lg border px-3 py-3 text-start text-sm', selected?.fieldId === field.id ? 'border-primary bg-primary/5' : 'border-border bg-muted/30')}>
                        <IconGrip className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{field.label || t.visits.field}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{t.visits.fieldTypes[field.type]}</span>
                      </DragItem>
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
            title={<span className="flex items-center gap-2"><IconFilters className="size-4 text-muted-foreground" aria-hidden />{t.visits.fieldSettings}</span>}
            className="bg-muted/30"
            headerActions={selectedField && selectedSection ? (
              <>
              <label className="flex items-center gap-1.5 text-xs">
                <SelectionToggle label={t.visits.required} checked={selectedField.required} disabled={locked} onChange={(required) => builder.patchField(selectedSection.id, selectedField.id, { required })} />
                {t.visits.required}
              </label>
              <RowActionsMenu
                items={[
                  { label: t.visits.moveUp, icon: IconArrowUp, disabled: locked || selectedSection.fields[0]?.id === selectedField.id, onSelect: () => builder.moveField(selectedSection.id, selectedSection.fields.findIndex((item) => item.id === selectedField.id), -1) },
                  { label: t.visits.moveDown, icon: IconArrowDown, disabled: locked || selectedSection.fields.at(-1)?.id === selectedField.id, onSelect: () => builder.moveField(selectedSection.id, selectedSection.fields.findIndex((item) => item.id === selectedField.id), 1) },
                  { label: t.common.remove, icon: IconDelete, variant: 'destructive', disabled: locked || selectedSection.fields.length === 1, onSelect: () => builder.removeField(selectedSection.id, selectedField.id) },
                ]}
              />
              </>
            ) : undefined}
            mobileSheet
            open={!!selectedField}
            onClose={() => builder.setSelected(selectedSection ? { sectionId: selectedSection.id } : null)}
          >
            {selectedField && selectedSection ? (
              <FieldSettings
                field={selectedField}
                locked={locked}
                problems={builder.problems}
                onPatch={(patch) => builder.patchField(selectedSection.id, selectedField.id, patch)}
                onType={(type) => builder.setType(selectedSection.id, selectedField, type)}
              />
            ) : (
              <div className="panel-swap"><EmptyState icon={IconFilters} title={t.visits.selectField} size="compact" /></div>
            )}
          </SidePanel>
        </div>
      </TabsContent>

      <TabsContent value="publish" className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-1">
        <TemplatePreview key={JSON.stringify(previewSections(draft))} sections={previewSections(draft)} title={getBilingualName(draft.name, draft.nameAr, lang)} />
      </TabsContent>
    </Tabs>
  );
}

function IconAction({ label, icon: Icon, disabled, onClick, variant = 'ghost' }: { label: string; icon: LucideIcon; disabled: boolean; onClick: () => void; variant?: 'ghost' | 'default' }) {
  return (
    <SoftTip label={label}>
      <Button type="button" size="icon" variant={variant} className="size-7 sm:size-8" disabled={disabled} aria-label={label} onClick={onClick}>
        <Icon className="size-4" />
      </Button>
    </SoftTip>
  );
}

function BuilderTabsList({ variant }: { variant: 'pill' | 'fill' }) {
  const { t } = useLanguage();
  return (
    <TabsList variant={variant} className={variant === 'pill' ? 'mx-auto' : undefined}>
      <TabsTrigger value="settings">{t.visits.builderSettings}</TabsTrigger>
      <TabsTrigger value="build">{t.visits.builderBuild}</TabsTrigger>
      <TabsTrigger value="publish">{t.visits.builderPreview}</TabsTrigger>
    </TabsList>
  );
}

function TemplatePreview({ sections, title }: { sections: ClinicalSection[]; title: string }) {
  const { lang, t } = useLanguage();
  const [values, setValues] = useState<Record<string, ClinicalValue>>({});
  const [focusedId, setFocusedId] = useState(sections[0]?.id ?? '');
  return (
    <Card className="min-h-0 min-w-0 flex-1 overflow-visible">
      <CardHeader>
        <p className="text-sm font-semibold">{title || t.visits.preview}</p>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
        <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="mx-auto flex w-full min-w-0 flex-1 flex-col gap-4">
          {sections.length ? <ClinicalFields sections={sections} values={values} lang={lang} focusedId={focusedId} onFocusSection={setFocusedId} onChange={(id, value) => setValues((current) => { const next = { ...current }; if (value === undefined) delete next[id]; else next[id] = value; return next; })} /> : <EmptyState framed={false} className="flex-1" icon={IconFileText} title={t.visits.previewIncomplete} />}
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
  scale: IconFieldScale,
  time: IconTime,
  medications: IconFieldMedication,
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
    if (compact) return (
      <div key={type} className="flex shrink-0 items-center rounded-xl border border-border/50 bg-muted/20">
        <Button type="button" variant="ghost" disabled={locked} onClick={() => onPick(type)} className="h-9 gap-1.5 px-2.5 font-normal">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          {t.visits.fieldTypes[type]}
        </Button>
        <DragItem label={t.visits.fieldTypes[type]} disabled={locked} variant="ghost" className="size-8 justify-center gap-0 p-0" onDrop={(target) => onDrop(type, target)}>
          <IconGrip className="size-3.5 text-muted-foreground" aria-hidden />
        </DragItem>
      </div>
    );
    return <DragItem key={type} label={t.visits.fieldTypes[type]} disabled={locked}
      className={cn('group/palette h-auto justify-start rounded-xl border-border/50 bg-muted/20 text-start font-normal hover:border-primary/40 hover:bg-primary/5', compact ? 'min-h-9 shrink-0 gap-1.5 px-2.5 py-1.5' : 'min-h-10 w-full px-2.5 py-2')}
      onPick={() => onPick(type)} onDrop={(target) => onDrop(type, target)}>
      <span className={cn('grid shrink-0 place-items-center rounded-lg bg-background text-muted-foreground group-hover/palette:text-primary', compact ? 'size-6' : 'size-7')}><Icon className={compact ? 'size-3.5' : 'size-4'} aria-hidden /></span>
      <span className={cn('min-w-0 flex-1 whitespace-normal leading-snug', compact ? 'text-xs' : 'text-sm')}>{t.visits.fieldTypes[type]}</span>
      {!compact ? <IconGrip className="size-3.5 shrink-0 text-muted-foreground/50" /> : null}
    </DragItem>;
  });
}

function FieldSettings({
  field,
  locked,
  problems,
  onPatch,
  onType,
}: {
  field: ClinicalField;
  locked: boolean;
  problems: string[];
  onPatch: (patch: Partial<ClinicalField>) => void;
  onType: (type: ClinicalField['type']) => void;
}) {
  const { t } = useLanguage();
  return (
    <div key={field.id} className="panel-swap space-y-3">
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
