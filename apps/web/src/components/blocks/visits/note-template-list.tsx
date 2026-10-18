'use client';

import { TEMPLATE_STATUS } from '@clinic/types';
import Link from 'next/link';
import { Badge, Button } from '@/components/ui';
import { EmptyState, ErrorState, IconCard } from '@/components/primitives';
import { IconFileText } from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
import { useClinicalNoteTemplates } from '@/hooks/api/use-clinical-note-templates';
import { getBilingualName } from '@/i18n';
import { useLanguage } from '@/providers';

export function NoteTemplateList() {
  const { lang, t } = useLanguage();
  const templates = useClinicalNoteTemplates();

  if (templates.isLoading) return <div className="h-40 animate-pulse rounded-xl bg-muted" />;
  if (templates.isError) return <ErrorState onRetry={() => void templates.refetch()} />;

  return (
    <div className="space-y-3">
      <Button asChild><Link href={ROUTES.SETTINGS_NOTE_TEMPLATE_NEW}>{t.visits.newTemplate}</Link></Button>
      {!templates.data?.length ? <EmptyState icon={IconFileText} title={t.visits.noTemplate} description={t.visits.templatesDesc} /> : null}
      {templates.data?.map((template) => (
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
