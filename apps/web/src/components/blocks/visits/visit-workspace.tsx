'use client';

import { useState } from 'react';
import { APPOINTMENT_STATUS, NOTE_STATUS, PRESENCE_SOURCE, ROLE, SESSION_TYPE } from '@clinic/types';
import { Badge, Button, Card, CardContent } from '@/components/ui';
import { EmptyState, ErrorState, ReasonDialog, VisitTimer } from '@/components/primitives';
import { IconFileText, IconInPerson, IconOnline } from '@/constants/icons';
import { formatDateTime } from '@/lib/datetime';
import { useAuth, useLanguage } from '@/providers';
import { useAvailableNoteTemplates } from '@/hooks/api/use-clinical-note-templates';
import { useCheckIn, useFinishVisit, useRevokeUnlock, useStartVisit, useUnlockNote, useVisitWorkspace } from '@/hooks/api/use-visits';
import { getBilingualName } from '@/i18n';
import { ClinicalNoteEditor } from './clinical-note-editor';
import { InvoiceReview } from './invoice-review';
import { MedicalReportEditor } from './medical-report-editor';

export function VisitWorkspace({ appointmentId }: { appointmentId: string }) {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const workspace = useVisitWorkspace(appointmentId);
  const templates = useAvailableNoteTemplates(user?.role === ROLE.PRACTITIONER ? appointmentId : '');
  const checkIn = useCheckIn(appointmentId);
  const start = useStartVisit(appointmentId);
  const finish = useFinishVisit(appointmentId);
  const unlock = useUnlockNote(appointmentId);
  const revoke = useRevokeUnlock(appointmentId);
  const [reasonMode, setReasonMode] = useState<'unlock' | 'revoke' | null>(null);
  const data = workspace.data;

  if (workspace.isLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }
  if (workspace.isError || !data) {
    return <ErrorState onRetry={() => void workspace.refetch()} />;
  }

  const closed = data.appointmentStatus === APPOINTMENT_STATUS.CANCELLED || data.appointmentStatus === APPOINTMENT_STATUS.NO_SHOW;
  const patientName = getBilingualName(data.patient.name, data.patient.nameAr, lang);
  const roomName = data.room ? getBilingualName(data.room.name, data.room.nameAr, lang) : t.visits.room;
  const presenceSource = data.mode === SESSION_TYPE.ONLINE ? PRESENCE_SOURCE.ONLINE_MANUAL : user?.role === ROLE.PRACTITIONER ? PRESENCE_SOURCE.PRACTITIONER : PRESENCE_SOURCE.FRONT_DESK;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 pb-6 xl:page-fill xl:pb-0">
      <div className="grid min-w-0 gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{t.visits.patient}</p>
                <h1 className="font-heading text-xl font-semibold">{patientName}</h1>
              </div>
              <Badge variant="muted">{data.mode === SESSION_TYPE.ONLINE ? t.visits.online : t.visits.inPerson}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{formatDateTime(data.scheduledAt, undefined, lang)}</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="info">{t.visits.noteStatuses[data.noteStatus]}</Badge>
              <Badge variant="muted">{t.visits.reportStatuses[data.reportStatus]}</Badge>
              <Badge variant="muted">{t.visits.invoiceStatuses[data.invoiceStatus]}</Badge>
            </div>
            {data.patientContext?.allergies || data.patientContext?.bloodType ? (
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                <p className="text-xs font-medium text-warning">{t.visits.alerts}</p>
                {data.patientContext.allergies ? <p className="mt-1 whitespace-pre-wrap">{data.patientContext.allergies}</p> : null}
                {data.patientContext.bloodType ? <p className="mt-1">{data.patientContext.bloodType}</p> : null}
              </div>
            ) : null}
            {data.documentationUnlock ? <p className="text-sm">{t.visits.unlocked}: {data.documentationUnlock.reason}</p> : null}
            {data.mode === SESSION_TYPE.IN_PERSON ? (
              <p className="flex items-center gap-2 text-sm"><IconInPerson className="size-4" />{roomName}</p>
            ) : data.meetingUrl ? (
              <a href={data.meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary underline-offset-2 hover:underline">
                <IconOnline className="size-4" />{t.visits.join}
              </a>
            ) : (
              <p className="flex items-center gap-2 text-sm text-warning"><IconOnline className="size-4" />{t.visits.joinMissing}</p>
            )}
            {data.presenceConfirmedAt ? <p className="text-xs text-muted-foreground">{t.visits.patientPresent}</p> : null}
            {data.documentationDeadlineAt && data.noteStatus !== NOTE_STATUS.SIGNED ? (
              <p className="text-sm">{data.noteStatus === 'locked' ? t.visits.lockedNote : t.visits.documentationPending} · {formatDateTime(data.documentationDeadlineAt, undefined, lang)}</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-4 xl:min-h-0 xl:overflow-y-auto">
          <VisitTimer serverNow={data.serverNow} startedAt={data.startedAt} durationMins={data.durationMins} />
          {closed ? <EmptyState icon={IconFileText} title={t.visits.closedVisit} description={t.visits.closedVisitDesc} /> : null}
          {!closed && data.allowedActions.confirmPresence && !data.presenceConfirmedAt ? (
            <Button type="button" disabled={checkIn.isPending} onClick={() => checkIn.mutate(presenceSource)}>{t.visits.confirmPresence}</Button>
          ) : null}
          {!closed && data.allowedActions.start ? (
            <Button type="button" disabled={start.isPending} onClick={() => start.mutate(data.appointmentRevision)}>{data.startedAt ? t.visits.resume : t.visits.start}</Button>
          ) : null}
          {!closed && data.allowedActions.finish && data.visitId ? (
            <Button type="button" variant="outline" disabled={finish.isPending} onClick={() => finish.mutate({ visitId: data.visitId!, expectedRevision: data.visitRevision })}>{t.visits.finish}</Button>
          ) : null}
          {data.allowedActions.unlockNote && data.visitId ? (
            <Button type="button" variant="outline" onClick={() => setReasonMode('unlock')}>{t.visits.unlock}</Button>
          ) : null}
          {data.allowedActions.revokeUnlock && data.visitId ? (
            <Button type="button" variant="outline" onClick={() => setReasonMode('revoke')}>{t.visits.revokeUnlock}</Button>
          ) : null}
          {data.note || user?.role === ROLE.PRACTITIONER ? (
            <section className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="font-heading text-lg font-semibold">{t.visits.note}</h2>
              <ClinicalNoteEditor appointmentId={appointmentId} workspace={data} templates={templates.data ?? []} />
            </section>
          ) : (
            <section className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">{t.visits.noteHidden}</section>
          )}
          <section className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5">
            <h2 className="font-heading text-lg font-semibold">{t.visits.report}</h2>
            <MedicalReportEditor appointmentId={appointmentId} workspace={data} />
          </section>
          <section className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5">
            <h2 className="font-heading text-lg font-semibold">{t.visits.invoice}</h2>
            <InvoiceReview appointmentId={appointmentId} workspace={data} />
          </section>
        </div>
      </div>
      <ReasonDialog
        open={reasonMode != null}
        title={reasonMode === 'revoke' ? t.visits.revokeUnlock : t.visits.unlock}
        pending={unlock.isPending || revoke.isPending}
        onOpenChange={(open) => { if (!open) setReasonMode(null); }}
        onSubmit={(reason) => {
          if (!data.visitId || !reasonMode) return;
          const mutation = reasonMode === 'revoke' ? revoke : unlock;
          mutation.mutate({ visitId: data.visitId, reason }, { onSuccess: () => setReasonMode(null) });
        }}
      />
    </div>
  );
}
