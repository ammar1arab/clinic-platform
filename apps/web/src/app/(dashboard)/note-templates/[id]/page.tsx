'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ROLE } from '@clinic/types';
import { NoteTemplateBuilder } from '@/components/blocks/visits/note-template-builder';
import { EmptyState, ErrorState, NoteTemplateBuilderSkeleton } from '@/components/primitives';
import { IconFileText } from '@/constants/icons';
import { useClinicalNoteTemplate } from '@/hooks/api/use-clinical-note-templates';
import { useAuth, useLanguage } from '@/providers';

function EditMedicalNoteTemplateInner() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const readOnly = useSearchParams().get('mode') === 'view';
  const template = useClinicalNoteTemplate(user?.role === ROLE.OWNER ? params.id : '');
  if (user && user.role !== ROLE.OWNER) {
    return <EmptyState icon={IconFileText} title={t.visits.templates} description={t.visits.noteHidden} />;
  }
  return (
    <div className="page-fill gap-2.5">
      {template.isLoading ? <NoteTemplateBuilderSkeleton /> : null}
      {template.isError ? <ErrorState onRetry={() => void template.refetch()} /> : null}
      {template.data ? <NoteTemplateBuilder key={readOnly ? 'view' : 'edit'} template={template.data} readOnly={readOnly} /> : null}
    </div>
  );
}

export default function EditMedicalNoteTemplatePage() {
  return (
    <Suspense fallback={null}>
      <EditMedicalNoteTemplateInner />
    </Suspense>
  );
}
