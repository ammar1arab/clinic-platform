'use client';

import { ROLE } from '@clinic/types';
import { NoteTemplateBuilder } from '@/components/blocks/visits/note-template-builder';
import { EmptyState, ErrorState, PageBack } from '@/components/primitives';
import { IconFileText } from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
import { useStarterNoteTemplate } from '@/hooks/api/use-clinical-note-templates';
import { useAuth, useLanguage } from '@/providers';

export default function NewMedicalNoteTemplatePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const starter = useStarterNoteTemplate(user?.role === ROLE.OWNER);
  if (user && user.role !== ROLE.OWNER) {
    return <EmptyState icon={IconFileText} title={t.visits.templates} description={t.visits.noteHidden} />;
  }
  return (
    <div className="space-y-4">
      <PageBack backHref={ROUTES.SETTINGS_NOTE_TEMPLATES} title={t.visits.templates} />
      {starter.isLoading ? <div className="h-80 animate-pulse rounded-xl bg-muted" /> : null}
      {starter.isError ? <ErrorState onRetry={() => void starter.refetch()} /> : null}
      {starter.data ? <NoteTemplateBuilder initial={starter.data} /> : null}
    </div>
  );
}
