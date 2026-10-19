'use client';

import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DRAFT_SAVE_PHASE, NOTE_STATUS, type ClinicalSection, type ClinicalValue, type DraftSavePhase, type TemplateDTO, type VisitErrorCode, type VisitWorkspace } from '@clinic/types';
import { Badge, Button, Card, CardContent, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { EmptyState, IconCard, ReasonDialog } from '@/components/primitives';
import { IconFileText } from '@/constants/icons';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useSignNote, useNoteAddendum, useNoteHistory, visitErrorCode } from '@/hooks/api/use-visits';
import { useUnsavedGuard } from '@/hooks/shared/use-now';
import { formatDate, formatTime } from '@/lib/datetime';
import { getBilingualName } from '@/i18n';
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
  const editSequence = useRef(0);
  const saving = useRef<Promise<VisitWorkspace | null> | null>(null);
  const savedRevision = useRef(note?.revision ?? 0);
  const bind = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, []);
  const [values, setValues] = useState<Record<string, ClinicalValue>>(note?.values ?? {});
  const [templateVersionId, setTemplateVersionId] = useState(note?.templateVersionId ?? '');
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
  const published = templates.filter((item) => item.publishedVersionId);
  useUnsavedGuard(dirty, t.visits.leaveWarning);

  const applyWorkspace = (next: VisitWorkspace) => {
    queryClient.setQueryData(QUERY_KEYS.visits.workspace(appointmentId), next);
  };

  const flush = async (nextValues: Record<string, ClinicalValue>, versionId: string, acknowledgeTemplateChange = false, revision?: number): Promise<VisitWorkspace | null> => {
    if (!workspace.visitId || !versionId || !canEdit) return null;
    const sequence = editSequence.current;
    while (saving.current) await saving.current;
    if (sequence !== editSequence.current) return null;
    setPhase(DRAFT_SAVE_PHASE.SAVING);
    const request = (async () => {
      try {
        const next = await visitsService.saveNote(workspace.visitId!, {
          templateVersionId: versionId,
          values: compactValues(sections, nextValues),
          revision: revision ?? Math.max(savedRevision.current, note?.revision ?? 0),
          ...(acknowledgeTemplateChange ? { acknowledgeTemplateChange: true } : {}),
        });
        savedRevision.current = next.note?.revision ?? savedRevision.current;
        applyWorkspace(next);
        if (sequence === editSequence.current) {
          setDirty(false);
          setPhase(DRAFT_SAVE_PHASE.SAVED);
          setAck(false);
        }
        return next;
      } catch (error) {
        if (sequence !== editSequence.current) return null;
        const code = visitErrorCode(error);
        const revisionConflict: VisitErrorCode = 'visitRevisionConflict';
        const templateConfirm: VisitErrorCode = 'clinicalTemplateChangeConfirmationRequired';
        if (code === revisionConflict) setPhase(DRAFT_SAVE_PHASE.CONFLICT);
        else if (code === templateConfirm) setPhase(DRAFT_SAVE_PHASE.CONFIRM_TEMPLATE);
        else setPhase(DRAFT_SAVE_PHASE.ERROR);
        return null;
      }
    })();
    saving.current = request;
    try { return await request; }
    finally { if (saving.current === request) saving.current = null; }
  };

  const schedule = (nextValues: Record<string, ClinicalValue>, versionId: string) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { void flush(nextValues, versionId, ack); }, 500);
  };

  const write = (fieldId: string, value: ClinicalValue | undefined) => {
    editSequence.current += 1;
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
    if (timer.current) window.clearTimeout(timer.current);
    editSequence.current += 1;
    valuesRef.current = {};
    setValues({});
    setTemplateVersionId(versionId);
    setAck(hasContent);
    setDirty(true);
    if (hasContent) setPhase(DRAFT_SAVE_PHASE.CONFIRM_TEMPLATE);
  };

  const phaseLabel = phase === DRAFT_SAVE_PHASE.SAVING ? t.visits.saving : phase === DRAFT_SAVE_PHASE.SAVED ? t.visits.saved : phase === DRAFT_SAVE_PHASE.ERROR ? t.visits.saveError : phase === DRAFT_SAVE_PHASE.CONFLICT ? t.visits.conflict : null;
  const picking = canEdit && !note && !templateVersionId;

  if (!workspace.visitId) {
    return <EmptyState icon={IconFileText} title={t.visits.clinicNote} description={t.visits.startBeforeNote} />;
  }
  if (!canEdit && !note) {
    return <EmptyState icon={IconFileText} title={t.visits.clinicNote} description={workspace.noteStatus === 'locked' ? t.visits.lockedNote : t.visits.noTemplateDesc} />;
  }
  if (canEdit && !note && !published.length) {
    return <EmptyState icon={IconFileText} title={t.visits.noTemplate} description={t.visits.noTemplateDesc} />;
  }

  return (
    <div ref={bind} className="space-y-4">
      <Card aura={false}>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">{t.visits.identityPatient}</p>
            <p className="text-sm font-medium">{getBilingualName(workspace.patient.name, workspace.patient.nameAr, lang)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.visits.identityWhen}</p>
            <p className="text-sm font-medium">{formatDate(workspace.scheduledAt, undefined, lang)} · {formatTime(workspace.scheduledAt, undefined, lang)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t.visits.identityClinician}</p>
            <p className="text-sm font-medium">{getBilingualName(workspace.practitioner.name, workspace.practitioner.nameAr, lang)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {canEdit && note && published.length > 0 ? (
          <Select value={templateVersionId} onValueChange={chooseTemplate}>
            <SelectTrigger className="w-full sm:max-w-xs"><SelectValue placeholder={t.visits.template} /></SelectTrigger>
            <SelectContent>
              {published.map((item) => (
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

      {picking ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold">{t.visits.pickTemplate}</p>
          {published.map((item) => (
            <IconCard
              key={item.id}
              icon={IconFileText}
              accent="teal"
              title={clinicalText(lang, item.name, item.nameAr)}
              description={t.visits.version.replace('{version}', String(item.version))}
              onClick={() => chooseTemplate(item.publishedVersionId ?? item.id)}
            />
          ))}
        </div>
      ) : null}

      {phase === DRAFT_SAVE_PHASE.CONFLICT ? (
        <div className="flex flex-wrap gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
          <p className="w-full">{t.visits.conflict}</p>
          <Button type="button" size="sm" onClick={() => void (async () => {
            const fresh = await visitsService.workspace(appointmentId);
            await flush(valuesRef.current, templateVersionId, ack, fresh.note?.revision ?? 0);
          })()}>{t.visits.keepMine}</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => { if (timer.current) window.clearTimeout(timer.current); editSequence.current += 1; setDirty(false); void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.visits.workspace(appointmentId) }); setPhase(DRAFT_SAVE_PHASE.IDLE); }}>{t.visits.loadServer}</Button>
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

      {!picking && sections.length ? (
        <ClinicalFields
          sections={sections}
          values={values}
          lang={lang}
          disabled={!canEdit}
          focusedId={focusedId}
          onFocusSection={setFocusedId}
          onChange={canEdit ? write : undefined}
        />
      ) : null}

      {canEdit && templateVersionId ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={phase === DRAFT_SAVE_PHASE.SAVING}
            onClick={() => {
              if (timer.current) window.clearTimeout(timer.current);
              void flush(values, templateVersionId, ack);
            }}
          >
            {t.visits.saveDraft}
          </Button>
          {workspace.allowedActions.signNote ? (
            <Button
              type="button"
              disabled={sign.isPending || phase === DRAFT_SAVE_PHASE.SAVING}
              onClick={() => {
                if (timer.current) window.clearTimeout(timer.current);
                void (async () => {
                  const saved = dirty ? await flush(values, templateVersionId, ack) : workspace;
                  if (!saved) return;
                  const revision = saved.note?.revision;
                  if (revision == null || !workspace.visitId) return;
                  sign.mutate({ visitId: workspace.visitId, revision });
                })();
              }}
            >
              {t.visits.signNote}
            </Button>
          ) : null}
        </div>
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
