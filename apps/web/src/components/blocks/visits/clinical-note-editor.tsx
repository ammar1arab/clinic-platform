'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DRAFT_SAVE_PHASE, NOTE_STATUS, type ClinicalSection, type ClinicalValue, type DraftSavePhase, type TemplateDTO, type VisitErrorCode, type VisitWorkspace } from '@clinic/types';
import { Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { EmptyState, ReasonDialog } from '@/components/primitives';
import { IconFileText } from '@/constants/icons';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useSignNote, useNoteAddendum, useNoteHistory, visitErrorCode } from '@/hooks/api/use-visits';
import { useUnsavedGuard } from '@/hooks/shared/use-now';
import { useLanguage } from '@/providers';
import { visitsService } from '@/services/visits.service';
import { ClinicalFields, clinicalText, fieldVisible } from './clinical-fields';

function compactValues(sections: ClinicalSection[], values: Record<string, ClinicalValue>) {
  const next: Record<string, ClinicalValue> = {};
  for (const field of sections.flatMap((section) => section.fields)) {
    if (!fieldVisible(field, values)) continue;
    const value = values[field.id];
    if (value == null) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    next[field.id] = value;
  }
  return next;
}

export function ClinicalNoteEditor({
  appointmentId,
  workspace,
  templates,
}: {
  appointmentId: string;
  workspace: VisitWorkspace;
  templates: TemplateDTO[];
}) {
  const { lang, t } = useLanguage();
  const queryClient = useQueryClient();
  const note = workspace.note;
  const sign = useSignNote(appointmentId);
  const addendum = useNoteAddendum(appointmentId);
  const history = useNoteHistory(workspace.visitId ?? '', !!note?.signedAt);
  const [phase, setPhase] = useState<DraftSavePhase>(DRAFT_SAVE_PHASE.IDLE);
  const [dirty, setDirty] = useState(false);
  const [focusedId, setFocusedId] = useState('');
  const [addendumOpen, setAddendumOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [ack, setAck] = useState(false);
  const timer = useRef<number | null>(null);
  const valuesRef = useRef<Record<string, ClinicalValue>>(note?.values ?? {});
  const generationRef = useRef(0);
  const [values, setValues] = useState<Record<string, ClinicalValue>>(note?.values ?? {});
  const [templateVersionId, setTemplateVersionId] = useState(note?.templateVersionId ?? templates.find((item) => item.publishedVersionId)?.publishedVersionId ?? '');
  const [seenNote, setSeenNote] = useState({ revision: note?.revision ?? -1, version: note?.templateVersionId ?? '' });
  const [generation, setGeneration] = useState(0);

  if (!dirty && note && (seenNote.revision !== note.revision || seenNote.version !== note.templateVersionId)) {
    setSeenNote({ revision: note.revision, version: note.templateVersionId });
    setValues(note.values);
    setTemplateVersionId(note.templateVersionId);
    setGeneration((current) => current + 1);
  }

  const selected = templates.find((item) => item.publishedVersionId === templateVersionId);
  const sections = note && note.templateVersionId === templateVersionId ? note.sectionsSnapshot : selected?.sections ?? note?.sectionsSnapshot ?? [];
  const canEdit = workspace.allowedActions.editNote;
  useUnsavedGuard(dirty, t.visits.leaveWarning);

  const applyWorkspace = (next: VisitWorkspace) => {
    queryClient.setQueryData(QUERY_KEYS.visits.workspace(appointmentId), next);
  };

  const flush = async (nextValues: Record<string, ClinicalValue>, versionId: string, acknowledgeTemplateChange = false, revision = note?.revision ?? 0) => {
    if (!workspace.visitId || !versionId || !canEdit) return null;
    setPhase(DRAFT_SAVE_PHASE.SAVING);
    try {
      const next = await visitsService.saveNote(workspace.visitId, {
        templateVersionId: versionId,
        values: compactValues(sections, nextValues),
        revision,
        ...(acknowledgeTemplateChange ? { acknowledgeTemplateChange: true } : {}),
      });
      applyWorkspace(next);
      setDirty(false);
      setPhase(DRAFT_SAVE_PHASE.SAVED);
      setAck(false);
      return next;
    } catch (error) {
      const code = visitErrorCode(error);
      const revisionConflict: VisitErrorCode = 'visitRevisionConflict';
      const templateConfirm: VisitErrorCode = 'clinicalTemplateChangeConfirmationRequired';
      if (code === revisionConflict) setPhase(DRAFT_SAVE_PHASE.CONFLICT);
      else if (code === templateConfirm) setPhase(DRAFT_SAVE_PHASE.CONFIRM_TEMPLATE);
      else setPhase(DRAFT_SAVE_PHASE.ERROR);
      return null;
    }
  };

  const schedule = (nextValues: Record<string, ClinicalValue>, versionId: string) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { void flush(nextValues, versionId, ack); }, 500);
  };

  const write = (fieldId: string, value: ClinicalValue | undefined) => {
    if (generationRef.current !== generation) {
      generationRef.current = generation;
      valuesRef.current = values;
    }
    const next = { ...valuesRef.current };
    if (value === undefined) delete next[fieldId];
    else next[fieldId] = value;
    valuesRef.current = next;
    setValues(next);
    setDirty(true);
    schedule(next, templateVersionId);
  };

  const chooseTemplate = (versionId: string) => {
    if (versionId === templateVersionId) return;
    const hasContent = Object.keys(values).length > 0;
    if (hasContent && !window.confirm(t.visits.changeTemplateWarning)) return;
    setTemplateVersionId(versionId);
    setAck(hasContent);
    setDirty(true);
    if (hasContent) setPhase(DRAFT_SAVE_PHASE.CONFIRM_TEMPLATE);
  };

  const phaseLabel = phase === DRAFT_SAVE_PHASE.SAVING ? t.visits.saving : phase === DRAFT_SAVE_PHASE.SAVED ? t.visits.saved : phase === DRAFT_SAVE_PHASE.ERROR ? t.visits.saveError : phase === DRAFT_SAVE_PHASE.CONFLICT ? t.visits.conflict : null;

  if (!workspace.visitId) {
    return <EmptyState icon={IconFileText} title={t.visits.note} description={t.visits.startBeforeNote} />;
  }
  if (!canEdit && !note) {
    return <EmptyState icon={IconFileText} title={t.visits.note} description={workspace.noteStatus === 'locked' ? t.visits.lockedNote : t.visits.noTemplateDesc} />;
  }
  if (canEdit && !note && !selected) {
    return <EmptyState icon={IconFileText} title={t.visits.noTemplate} description={t.visits.noTemplateDesc} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {canEdit && templates.length > 0 ? (
          <Select value={templateVersionId} onValueChange={chooseTemplate}>
            <SelectTrigger className="w-full sm:max-w-xs"><SelectValue placeholder={t.visits.template} /></SelectTrigger>
            <SelectContent>
              {templates.filter((item) => item.publishedVersionId).map((item) => (
                <SelectItem key={item.id} value={item.publishedVersionId ?? item.id}>
                  {clinicalText(lang, item.name, item.nameAr)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        {note ? <Badge variant="muted">{t.visits.templateVersion.replace('{version}', String(note.templateVersion))}</Badge> : null}
        <Badge variant={workspace.noteStatus === NOTE_STATUS.LOCKED ? 'warning' : workspace.noteStatus === NOTE_STATUS.SIGNED ? 'success' : 'info'}>
          {t.visits.noteStatuses[workspace.noteStatus]}
        </Badge>
        {phaseLabel ? <span className="text-xs text-muted-foreground">{phaseLabel}</span> : null}
      </div>

      {phase === DRAFT_SAVE_PHASE.CONFLICT ? (
        <div className="flex flex-wrap gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
          <p className="w-full">{t.visits.conflict}</p>
          <Button type="button" size="sm" onClick={() => void (async () => {
            const fresh = await visitsService.workspace(appointmentId);
            await flush(valuesRef.current, templateVersionId, ack, fresh.note?.revision ?? 0);
          })()}>{t.visits.keepMine}</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => { setDirty(false); void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visits.workspace(appointmentId) }); setPhase(DRAFT_SAVE_PHASE.IDLE); }}>{t.visits.loadServer}</Button>
        </div>
      ) : null}
      {phase === DRAFT_SAVE_PHASE.CONFIRM_TEMPLATE ? (
        <div className="flex flex-wrap gap-2 rounded-xl border border-border p-3 text-sm">
          <p className="w-full">{t.visits.changeTemplateWarning}</p>
          <Button type="button" size="sm" onClick={() => { setAck(true); void flush(valuesRef.current, templateVersionId, true); }}>{t.visits.changeTemplate}</Button>
        </div>
      ) : null}
      {phase === DRAFT_SAVE_PHASE.ERROR ? (
        <Button type="button" variant="outline" size="sm" onClick={() => void flush(valuesRef.current, templateVersionId, ack)}>{t.visits.retrySave}</Button>
      ) : null}

      <ClinicalFields
        sections={sections}
        values={values}
        lang={lang}
        disabled={!canEdit}
        focusedId={focusedId}
        onFocusSection={setFocusedId}
        onChange={canEdit ? write : undefined}
      />

      {workspace.allowedActions.signNote ? (
        <Button
          type="button"
          disabled={sign.isPending || phase === DRAFT_SAVE_PHASE.SAVING}
          onClick={() => {
            if (timer.current) window.clearTimeout(timer.current);
            void (async () => {
              const saved = dirty ? await flush(valuesRef.current, templateVersionId, ack) : workspace;
              const revision = saved?.note?.revision ?? note?.revision;
              if (revision == null || !workspace.visitId) return;
              sign.mutate({ visitId: workspace.visitId, revision });
            })();
          }}
        >
          {t.visits.signNote}
        </Button>
      ) : null}

      {workspace.allowedActions.addAddendum ? (
        <Button type="button" variant="outline" onClick={() => setAddendumOpen(true)}>{t.visits.addendum}</Button>
      ) : null}
      {note?.signedAt ? (
        <Button type="button" variant="ghost" onClick={() => setHistoryOpen((open) => !open)}>{t.visits.history}</Button>
      ) : null}
      {historyOpen ? (
        <ul className="space-y-2 text-sm">
          {(history.data?.items ?? note?.addenda ?? []).map((event) => (
            <li key={event.id} className="rounded-lg border border-border px-3 py-2">
              <p className="text-xs text-muted-foreground">{event.kind} · {event.createdAt}</p>
              {event.reason ? <p>{event.reason}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <ReasonDialog
        open={addendumOpen}
        title={t.visits.addendum}
        withText
        pending={addendum.isPending}
        onOpenChange={setAddendumOpen}
        onSubmit={(reason, text) => {
          if (!workspace.visitId || !text) return;
          addendum.mutate({ visitId: workspace.visitId, text, reason }, { onSuccess: () => setAddendumOpen(false) });
        }}
      />
    </div>
  );
}
