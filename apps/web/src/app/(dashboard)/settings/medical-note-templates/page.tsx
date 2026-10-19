'use client';

import { ROLE } from '@clinic/types';
import { NoteTemplateList } from '@/components/blocks/visits/note-template-list';
import { EmptyState } from '@/components/primitives';
import { IconFileText } from '@/constants/icons';
import { useAuth, useLanguage } from '@/providers';

export default function MedicalNoteTemplatesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  if (user && user.role !== ROLE.OWNER) {
    return <EmptyState icon={IconFileText} title={t.visits.templates} description={t.visits.noteHidden} />;
  }
  return <NoteTemplateList />;
}
