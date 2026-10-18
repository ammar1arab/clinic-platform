'use client';

import { ROLE } from '@clinic/types';
import { NoteTemplateList } from '@/components/blocks/visits/note-template-list';
import { EmptyState, PageBack } from '@/components/primitives';
import { IconFileText } from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
import { useAuth, useLanguage } from '@/providers';

export default function MedicalNoteTemplatesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  if (user && user.role !== ROLE.OWNER) {
    return <EmptyState icon={IconFileText} title={t.visits.templates} description={t.visits.noteHidden} />;
  }
  return (
    <div className="space-y-4">
      <PageBack backHref={ROUTES.SETTINGS} title={t.layout.titles.settings} />
      <NoteTemplateList />
    </div>
  );
}
