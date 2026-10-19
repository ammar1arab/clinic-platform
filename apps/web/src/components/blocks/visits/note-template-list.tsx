'use client';

import { useState } from 'react';
import { TEMPLATE_STATUS, type TemplateStatus } from '@clinic/types';
import Link from 'next/link';
import { Badge, Button, Popover, PopoverContent, PopoverTrigger, SelectItem } from '@/components/ui';
import { EmptyState, ErrorState, FilterSelect, IconCard, IconCardSkeleton, PageBack, SearchInput } from '@/components/primitives';
import { IconAdd, IconFileText, IconFilters } from '@/constants/icons';
import { keepNestedPortals } from '@/lib/overlay';
import { ROUTES } from '@/constants/routes';
import { useClinicalNoteTemplates } from '@/hooks/api/use-clinical-note-templates';
import { getBilingualName } from '@/i18n';
import { useLanguage } from '@/providers';

export function NoteTemplateList() {
  const { lang, t } = useLanguage();
  const templates = useClinicalNoteTemplates();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const items = (templates.data ?? []).filter((template) => {
    if (status && template.status !== status) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${template.name} ${template.nameAr ?? ''}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <PageBack backHref={ROUTES.SETTINGS}
        search={<SearchInput value={search} onChange={setSearch} placeholder={t.common.search} className="w-full" />}
        actions={<div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="relative size-9" aria-label={t.common.filters}>
                <IconFilters className="size-4" />
                {status ? <span aria-hidden className="absolute end-1 top-1 size-1.5 rounded-full bg-primary" /> : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 space-y-3" onInteractOutside={keepNestedPortals} onFocusOutside={keepNestedPortals}>
              <p className="text-sm font-medium">{t.common.filters}</p>
              <FilterSelect label={t.common.status} value={status} onChange={setStatus}>
                {Object.values(TEMPLATE_STATUS).map((value: TemplateStatus) => <SelectItem key={value} value={value}>{t.visits.templateStatuses[value]}</SelectItem>)}
              </FilterSelect>
              {status ? <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setStatus('')}>{t.common.clear}</Button> : null}
            </PopoverContent>
          </Popover>
          <Button asChild className="h-9 shrink-0 px-2 sm:px-3">
            <Link href={ROUTES.SETTINGS_NOTE_TEMPLATE_NEW} aria-label={t.visits.newTemplate}><IconAdd className="size-4" /><span className="hidden sm:inline">{t.visits.newTemplate}</span></Link>
          </Button>
        </div>}
      />
      {templates.isLoading ? <IconCardSkeleton count={4} /> : null}
      {templates.isError ? <ErrorState onRetry={() => void templates.refetch()} /> : null}
      {!templates.isLoading && !templates.isError && !items.length ? (
        <EmptyState icon={IconFileText} title={t.visits.templates} description={t.visits.templatesDesc} />
      ) : null}
      {items.map((template) => (
        <IconCard
          key={template.id}
          href={ROUTES.SETTINGS_NOTE_TEMPLATE(template.id)}
          title={getBilingualName(template.name, template.nameAr, lang)}
          description={t.visits.version.replace('{version}', String(template.version))}
          icon={IconFileText}
          accent="teal"
          endContent={<Badge variant={template.status === TEMPLATE_STATUS.PUBLISHED ? 'success' : 'muted'}>{t.visits.templateStatuses[template.status]}</Badge>}
        />
      ))}
    </div>
  );
}
