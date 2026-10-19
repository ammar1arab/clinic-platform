'use client';

import { useParams } from 'next/navigation';
import { ROLE } from '@clinic/types';
import { NoteTemplateBuilder } from '@/components/blocks/visits/note-template-builder';
import { EmptyState, ErrorState, NoteTemplateBuilderSkeleton } from '@/components/primitives';
import { IconFileText } from '@/constants/icons';
import { useClinicalNoteTemplate } from '@/hooks/api/use-clinical-note-templates';
import { useAuth, useLanguage } from '@/providers';

export default function EditMedicalNoteTemplatePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const template = useClinicalNoteTemplate(user?.role === ROLE.OWNER ? params.id : '');
  if (user && user.role !== ROLE.OWNER) {
    return <EmptyState icon={IconFileText} title={t.visits.templates} description={t.visits.noteHidden} />;
  }
  return (
    <div className="page-fill gap-4">
      {template.isLoading ? <NoteTemplateBuilderSkeleton /> : null}
      {template.isError ? <ErrorState onRetry={() => void template.refetch()} /> : null}
      {template.data ? <NoteTemplateBuilder template={template.data} /> : null}
    </div>
  );
}
