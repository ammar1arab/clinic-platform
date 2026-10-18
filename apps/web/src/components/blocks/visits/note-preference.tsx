'use client';

import { ErrorState, SearchablePicker } from '@/components/primitives';
import { Card, CardContent, Skeleton } from '@/components/ui';
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
  const error = templates.isError || preference.isError;

  return (
    <Card>
      <CardContent className="space-y-3">
        <h2 className="text-sm font-semibold">{t.visits.preference}</h2>
        <p className="text-sm text-muted-foreground">{t.visits.preferenceDesc}</p>
        {error ? (
          <ErrorState onRetry={() => {
            if (templates.isError) void templates.refetch();
            if (preference.isError) void preference.refetch();
          }} />
        ) : templates.isPending || preference.isPending ? (
          <Skeleton className="h-9 w-full rounded-lg" />
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
