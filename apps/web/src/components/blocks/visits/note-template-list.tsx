'use client';

import { useSessionStorageState } from '@/hooks/shared/use-session-storage-state';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TEMPLATE_STATUS, type TemplateDTO, type TemplateStatus } from '@clinic/types';
import { Badge, Button, Card, CardContent, Popover, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { DIRECTORY_ACTION_CLASS, DirectoryToolbar, EmptyState, ErrorState, FilterPanel, FilterSelect, FilterTrigger, FormField, NOTE_TEMPLATE_GRID, NoteTemplateCardSkeleton, Pagination, PinMark, RowActionsMenu, SoftTip, TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/primitives';
import { IconAdd, IconDelete, IconEdit, IconFileText, IconNoteCard, IconLibrary, IconPin, IconView } from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
import { TEMPLATE_STATUS_VARIANT } from '@/constants/status';
import { useClinicalNoteTemplates, useClinicNoteDefault, useCreateClinicalNoteTemplate, useArchiveClinicalNoteTemplate, useDeleteClinicalNoteTemplate, usePublishClinicalNoteTemplate, useSetClinicNoteDefault, useStarterNoteTemplates } from '@/hooks/api/use-clinical-note-templates';
import { getBilingualName } from '@/i18n';
import { useLanguage } from '@/providers';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { cn } from '@/lib/utils';
import { TEMPLATE_AUDIENCE, matchesAudience, type TemplateAudience } from './note-template-form';

const PAGE_SIZE = 18;
const SORT = { RECENT: 'recent', NAME: 'name' } as const;
type Sort = (typeof SORT)[keyof typeof SORT];

export function NoteTemplateList() {
  const { lang, t } = useLanguage();
  const clinicId = useClinicId();
  const router = useRouter();
  const starters = useStarterNoteTemplates();
  const create = useCreateClinicalNoteTemplate();
  const templates = useClinicalNoteTemplates();
  const clinicDefault = useClinicNoteDefault();
  const setDefault = useSetClinicNoteDefault();
  const remove = useDeleteClinicalNoteTemplate();
  const publish = usePublishClinicalNoteTemplate();
  const archive = useArchiveClinicalNoteTemplate();
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const scope = clinicId || 'none';
  const [search, setSearch] = useSessionStorageState(`${scope}:note-templates-search`, '');
  const [status, setStatus] = useSessionStorageState<TemplateStatus | ''>(`${scope}:note-templates-status`, '');
  const [audience, setAudience] = useSessionStorageState<TemplateAudience | ''>(`${scope}:note-templates-audience`, '');
  const [sort, setSort] = useSessionStorageState<Sort>(`${scope}:note-templates-sort`, SORT.RECENT);
  const [page, setPage] = useSessionStorageState(`${scope}:note-templates-page`, 1);
  const activeFilters = Number(status !== '') + Number(audience !== '') + Number(sort !== SORT.RECENT);
  const resetFilters = () => { setStatus(''); setAudience(''); setSort(SORT.RECENT); setPage(1); };

  const defaultId = clinicDefault.data?.templateId ?? null;
  const all = templates.data ?? [];
  const defaultTemplate = all.find((item) => item.id === defaultId) ?? null;
  const q = search.trim().toLowerCase();
  const others = all
    .filter((item) => item.id !== defaultId)
    .filter((item) => !q || `${item.name} ${item.nameAr ?? ''}`.toLowerCase().includes(q))
    .filter((item) => !status || item.status === status)
    .filter((item) => !audience || matchesAudience(item, audience))
    .sort((a, b) => sort === SORT.NAME ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt));

  const pageCount = Math.max(1, Math.ceil(others.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = others.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const loading = templates.isLoading || clinicDefault.isPending || starters.isLoading;

  const renderCard = (template: TemplateDTO, pinned = false) => {
    const name = getBilingualName(template.name, template.nameAr, lang);
    const canSetDefault = template.status === TEMPLATE_STATUS.PUBLISHED && template.availableToAll && template.id !== defaultId;
    return (
      <Card key={template.id} className={cn('card-aura gap-0 py-0', pinned && 'border-primary/40 bg-primary/5')}>
        <CardContent className="flex items-center gap-2.5 p-2.5 sm:gap-3 sm:p-3.5">
          <Link href={ROUTES.NOTE_TEMPLATE(template.id)} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-ring sm:gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary sm:size-10"><IconNoteCard className="size-4 sm:size-5" /></span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">{name}</span>
          </Link>
          <Select
            value={template.status}
            disabled={template.status === TEMPLATE_STATUS.ARCHIVED || publish.isPending || archive.isPending}
            onValueChange={(value) => {
              if (value === TEMPLATE_STATUS.PUBLISHED) publish.mutate({ id: template.id, revision: template.revision });
              else if (value === TEMPLATE_STATUS.ARCHIVED) archive.mutate({ id: template.id, revision: template.revision });
            }}
          >
            <SelectTrigger size="sm" aria-label={t.common.status} className="h-7 w-auto shrink-0 gap-1 border-transparent bg-transparent px-1">
              <Badge variant={TEMPLATE_STATUS_VARIANT[template.status]}><SelectValue /></Badge>
            </SelectTrigger>
            <SelectContent>
              {Object.values(TEMPLATE_STATUS).map((value) => (
                <SelectItem key={value} value={value} disabled={value === TEMPLATE_STATUS.DRAFT || value === TEMPLATE_STATUS.SCHEDULED}>{t.visits.templateStatuses[value]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pinned ? <PinMark active label={t.visits.clinicDefault} /> : null}
          <RowActionsMenu items={[
            { label: t.common.view, icon: IconView, onSelect: () => router.push(`${ROUTES.NOTE_TEMPLATE(template.id)}?mode=view`) },
            { label: t.common.edit, icon: IconEdit, onSelect: () => router.push(ROUTES.NOTE_TEMPLATE(template.id)) },
            ...(pinned ? [] : [{
              label: t.visits.setClinicDefault,
              icon: IconPin,
              disabled: !canSetDefault || setDefault.isPending,
              onSelect: () => setDefault.mutate(template.id),
            }]),
            { label: t.common.delete, icon: IconDelete, variant: 'destructive' as const, onSelect: () => del.ask({ id: template.id, name }) },
          ]} />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn('flex flex-col gap-3 sm:gap-4', loading && 'page-fill overflow-hidden [&>*]:shrink-0')}>
      <DirectoryToolbar
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder={t.common.search}
        actions={
          <>
            <Popover>
              <FilterTrigger count={activeFilters} />
              <FilterPanel count={activeFilters} onClear={resetFilters}>
                <FormField label={t.common.sort} labelClassName="text-xs">
                  <Select value={sort} onValueChange={(value) => { setSort(value as Sort); setPage(1); }}>
                    <SelectTrigger className="h-8 w-full rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SORT.RECENT}>{t.visits.sortRecent}</SelectItem>
                      <SelectItem value={SORT.NAME}>{t.common.name}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FilterSelect label={t.common.status} value={status} onChange={(value) => { setStatus(value as TemplateStatus | ''); setPage(1); }}>
                  {Object.values(TEMPLATE_STATUS).map((value) => <SelectItem key={value} value={value}>{t.visits.templateStatuses[value]}</SelectItem>)}
                </FilterSelect>
                <FilterSelect label={t.common.targetAudience} value={audience} onChange={(value) => { setAudience(value as TemplateAudience | ''); setPage(1); }}>
                  <SelectItem value={TEMPLATE_AUDIENCE.ALL}>{t.visits.audienceAll}</SelectItem>
                  <SelectItem value={TEMPLATE_AUDIENCE.DEPARTMENTS}>{t.visits.audienceDepartments}</SelectItem>
                  <SelectItem value={TEMPLATE_AUDIENCE.SERVICES}>{t.visits.audienceServices}</SelectItem>
                  <SelectItem value={TEMPLATE_AUDIENCE.PRACTITIONERS}>{t.visits.audiencePractitioners}</SelectItem>
                </FilterSelect>
              </FilterPanel>
            </Popover>
            <SoftTip label={t.visits.newTemplate}>
              <Button asChild size="sm" className={DIRECTORY_ACTION_CLASS}>
                <Link href={ROUTES.NOTE_TEMPLATE_NEW} aria-label={t.visits.newTemplate}>
                  <IconAdd className="size-3.5 shrink-0" />
                  <span className="hidden font-semibold sm:inline">{t.visits.newTemplate}</span>
                </Link>
              </Button>
            </SoftTip>
          </>
        }
      />

      {clinicDefault.isError ? <ErrorState onRetry={() => void clinicDefault.refetch()} /> : loading ? <NoteTemplateCardSkeleton /> : defaultTemplate ? renderCard(defaultTemplate, true) : null}

      <section className="space-y-2.5 sm:space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground sm:text-sm">{t.visits.readyMade}</h2>
        {starters.isError ? <ErrorState onRetry={() => void starters.refetch()} /> : loading ? <div className={NOTE_TEMPLATE_GRID}>{Array.from({ length: 6 }, (_, index) => <NoteTemplateCardSkeleton key={index} />)}</div> : (
          <div className={NOTE_TEMPLATE_GRID}>
            {(starters.data ?? []).map((starter) => (
              <Card key={starter.name} className="card-aura gap-0 py-0">
                <CardContent className="flex items-center gap-2.5 p-2.5 sm:gap-3 sm:p-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary sm:size-10"><IconLibrary className="size-4 sm:size-5" /></span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">{getBilingualName(starter.name, starter.nameAr, lang)}</span>
                  <Button type="button" size="sm" variant="outline" disabled={create.isPending} aria-label={t.visits.useTemplate} onClick={() => create.mutate(starter, { onSuccess: (saved) => router.push(ROUTES.NOTE_TEMPLATE(saved.id)) })}>
                    <IconAdd className="size-3.5" /><span className="max-sm:sr-only">{t.visits.useTemplate}</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2.5 sm:space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground sm:text-sm">{t.visits.createdTemplates}</h2>
        {templates.isError ? <ErrorState onRetry={() => void templates.refetch()} /> : null}
        {loading ? <div className={NOTE_TEMPLATE_GRID}>{Array.from({ length: 12 }, (_, index) => <NoteTemplateCardSkeleton key={index} />)}</div> : null}
        {!loading && !templates.isError && !others.length ? (
          <EmptyState icon={IconFileText} title={t.visits.templates} description={t.visits.templatesDesc} />
        ) : null}
        {!loading && others.length ? <div className={NOTE_TEMPLATE_GRID}>{pageItems.map((item) => renderCard(item))}</div> : null}
        {!loading ? <Pagination page={currentPage} pageCount={pageCount} totalItems={others.length} pageSize={PAGE_SIZE} onPageChange={setPage} /> : null}
      </section>

      <TwoStepDeleteDialogs
        step1={del.step1}
        step2={del.step2}
        onStep1OpenChange={(open) => !open && del.cancelStep1()}
        onStep2OpenChange={(open) => !open && del.cancelStep2()}
        onContinue={del.advance}
        onConfirm={() => {
          if (!del.step2) return;
          remove.mutate(del.step2.id, { onSuccess: del.clear });
        }}
        isPending={remove.isPending}
        warning={t.visits.deleteTemplateWarning}
        finalWarning={t.visits.deleteTemplateFinalWarning}
      />
    </div>
  );
}
