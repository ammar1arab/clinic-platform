'use client';

import { ErrorState, SearchablePicker } from '@/components/primitives';
import { Skeleton } from '@/components/ui';
import { useMyNoteTemplates } from '@/hooks/api/use-clinical-note-templates';
import { useNotePreference, useSetNotePreference } from '@/hooks/api/use-visits';
import { getBilingualName } from '@/i18n';
import { useLanguage } from '@/providers';

export function NotePreference() {
  const { lang, t } = useLanguage();
  const templates = useMyNoteTemplates();
  const preference = useNotePreference(true);
  const save = useSetNotePreference();
  const published = templates.data ?? [];
  const busy = templates.isPending || preference.isPending || save.isPending;

  if (templates.isError || preference.isError) {
    return (
      <ErrorState
        onRetry={() => {
          if (templates.isError) void templates.refetch();
          if (preference.isError) void preference.refetch();
        }}
      />
    );
  }
  if (templates.isPending || preference.isPending) {
    return <Skeleton className="h-9 w-full rounded-lg" />;
  }

  return (
    <fieldset disabled={busy} className="min-w-0 border-0 p-0 disabled:opacity-70" aria-busy={busy}>
      <SearchablePicker
        options={[{ value: '', label: t.visits.noPreference }, ...published.map((item) => ({ value: item.id, label: getBilingualName(item.name, item.nameAr, lang) }))]}
        value={preference.data?.templateId ?? ''}
        onChange={(templateId) => {
          if (!busy && templateId !== (preference.data?.templateId ?? '')) save.mutate(templateId || null);
        }}
        placeholder={t.visits.preference}
      />
    </fieldset>
  );
}
