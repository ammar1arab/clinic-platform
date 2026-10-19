'use client';

import { useState } from 'react';
import { APPOINTMENT_STATUS, NOTE_STATUS, PRESENCE_SOURCE, ROLE, SESSION_TYPE } from '@clinic/types';
import { Badge, Button, Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import {
  EmptyState,
  ErrorState,
  VisitWorkspaceSkeleton,
  PageBack,
  PhoneLink,
  PreviewableAvatar,
  ReasonDialog,
  VisitTimer,
} from '@/components/primitives';
import { IconClinicalRecord, IconInPerson, IconOnline, IconPhone } from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
import { formatDate, formatTime } from '@/lib/datetime';
import { useAuth, useLanguage } from '@/providers';
import { useAvailableNoteTemplates } from '@/hooks/api/use-clinical-note-templates';
import { useCheckIn, useFinishVisit, useRevokeUnlock, useStartVisit, useUnlockNote, useVisitWorkspace } from '@/hooks/api/use-visits';
import { getBilingualName } from '@/i18n';
import { ClinicalNoteEditor } from './clinical-note-editor';
import { StatusBadgeBlock } from '@/components/blocks/appointments/shared/status-badge';
import { InvoiceReview } from './invoice-review';
import { MedicalReportEditor } from './medical-report-editor';

export function VisitWorkspace({ appointmentId }: { appointmentId: string }) {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const workspace = useVisitWorkspace(appointmentId);
  const data = workspace.data;
  const templates = useAvailableNoteTemplates(user?.role === ROLE.PRACTITIONER && data?.allowedActions.editNote ? appointmentId : '');
  const checkIn = useCheckIn(appointmentId);
  const start = useStartVisit(appointmentId);
  const finish = useFinishVisit(appointmentId);
  const unlock = useUnlockNote(appointmentId);
  const revoke = useRevokeUnlock(appointmentId);
  const [reasonMode, setReasonMode] = useState<'unlock' | 'revoke' | null>(null);

  if (workspace.isLoading) {
    return (
      <div className="flex min-h-full w-full min-w-0 shrink-0 flex-col gap-3">
        <PageBack backHref={ROUTES.VISITS} />
        <VisitWorkspaceSkeleton />
      </div>
    );
  }
  if (workspace.isError || !data) {
    return (
      <div className="flex min-h-full w-full min-w-0 shrink-0 flex-col gap-3">
        <PageBack backHref={ROUTES.VISITS} />
        <ErrorState onRetry={() => void workspace.refetch()} />
      </div>
    );
  }

  const closed = data.appointmentStatus === APPOINTMENT_STATUS.CANCELLED || data.appointmentStatus === APPOINTMENT_STATUS.NO_SHOW;
  const patientName = getBilingualName(data.patient.name, data.patient.nameAr, lang);
  const roomName = data.room ? getBilingualName(data.room.name, data.room.nameAr, lang) : t.visits.room;
  const presenceSource = data.mode === SESSION_TYPE.ONLINE ? PRESENCE_SOURCE.ONLINE_MANUAL : user?.role === ROLE.PRACTITIONER ? PRESENCE_SOURCE.PRACTITIONER : PRESENCE_SOURCE.FRONT_DESK;
  const showActions = data.startedAt || data.allowedActions.unlockNote || data.allowedActions.revokeUnlock || (!closed && (
    (data.allowedActions.confirmPresence && !data.presenceConfirmedAt) || data.allowedActions.start || data.allowedActions.finish
  ));

  return (
    <div className="flex min-h-full w-full min-w-0 shrink-0 flex-col gap-3">
      <PageBack backHref={ROUTES.VISITS} className="flex-wrap" actions={showActions ? (<div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {data.startedAt ? <VisitTimer serverNow={data.serverNow} startedAt={data.startedAt} finishedAt={data.finishedAt} durationMins={data.durationMins} compact /> : null}
            <div className="flex flex-wrap gap-2">
            {!closed && data.allowedActions.confirmPresence && !data.presenceConfirmedAt ? (
              <Button type="button" disabled={checkIn.isPending} onClick={() => checkIn.mutate(presenceSource)}>{t.visits.confirmPresence}</Button>
            ) : null}
            {!closed && data.allowedActions.start ? (
              <Button type="button" disabled={start.isPending} onClick={() => start.mutate(data.appointmentRevision)}>{data.startedAt ? t.visits.resume : t.visits.start}</Button>
            ) : null}
            {!closed && data.allowedActions.finish && data.visitId ? (
              <Button type="button" disabled={finish.isPending} onClick={() => finish.mutate({ visitId: data.visitId!, expectedRevision: data.visitRevision })}>{t.visits.finish}</Button>
            ) : null}
            {data.allowedActions.unlockNote && data.visitId ? (
              <Button type="button" variant="outline" onClick={() => setReasonMode('unlock')}>{t.visits.unlock}</Button>
            ) : null}
            {data.allowedActions.revokeUnlock && data.visitId ? (
              <Button type="button" variant="outline" onClick={() => setReasonMode('revoke')}>{t.visits.revokeUnlock}</Button>
            ) : null}
            </div>
          </div>) : undefined} />

      <Card className="gap-0 py-0">
        <CardContent className="space-y-3 p-3 sm:p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <PreviewableAvatar src={data.patient.imageUrl} seed={data.patient.id} size="lg" />
              <div className="min-w-0">
              <h1 className="break-words font-heading text-lg font-semibold tracking-tight sm:text-xl">{patientName}</h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {formatDate(data.scheduledAt, undefined, lang)} · {formatTime(data.scheduledAt, undefined, lang)} · {t.visits.plannedDuration.replace('{minutes}', String(data.durationMins))}
              </p>
            </div>
              </div>
            <div className="flex max-w-36 flex-col items-end gap-2 sm:max-w-52">
              <StatusBadgeBlock status={data.appointmentStatus} tip={false} />
            {data.mode === SESSION_TYPE.IN_PERSON ? (
              <Badge variant="outline" className="h-6 min-h-0 max-w-full px-2 py-0 text-[11px] leading-none sm:text-xs"><span className="truncate">{t.visits.inPerson}{data.room ? ` · ${roomName}` : ''}</span></Badge>
            ) : data.meetingUrl ? (
              <Badge variant="outline" asChild><a href={data.meetingUrl} target="_blank" rel="noopener noreferrer">
                <IconOnline className="size-4" />{t.visits.join}
              </a></Badge>
            ) : (
              <Badge variant="warning" className="whitespace-normal text-end"><IconOnline className="size-4" />{t.visits.joinMissing}</Badge>
            )}
            </div>
          </div>

          <dl className="grid grid-cols-2 items-start gap-x-4 gap-y-3 text-xs sm:text-sm lg:grid-cols-4">
            <div className="min-w-0 space-y-1"><dt className="text-xs text-muted-foreground">{t.patient.practitioner}</dt><dd className="flex items-center gap-2 font-medium"><PreviewableAvatar src={data.practitioner.imageUrl} seed={data.practitioner.id} size="sm" />{getBilingualName(data.practitioner.name, data.practitioner.nameAr, lang)}</dd></div>
            {data.patientContext?.phone ? <div className="min-w-0 space-y-1"><dt className="text-xs text-muted-foreground">{t.patient.phone}</dt><dd className="flex items-center gap-2"><IconPhone className="size-4 shrink-0 text-muted-foreground" /><PhoneLink copyable value={data.patientContext.phone} /></dd></div> : null}
              {data.patientContext?.allergies ? <div className="min-w-0 space-y-1"><dt className="text-xs text-muted-foreground">{t.patient.allergies}</dt><dd className="whitespace-pre-wrap break-words font-medium text-warning">{data.patientContext.allergies}</dd></div> : null}
              {data.patientContext?.bloodType ? <div className="min-w-0 space-y-1"><dt className="text-xs text-muted-foreground">{t.patient.bloodType}</dt><dd><bdi dir="ltr">{data.patientContext.bloodType}</bdi></dd></div> : null}
          </dl>

          {data.documentationUnlock || (data.documentationDeadlineAt && !data.documentationUnlock && data.noteStatus !== NOTE_STATUS.SIGNED) ? <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
            {data.documentationUnlock ? <p>{t.visits.unlocked}: {data.documentationUnlock.reason}</p> : null}
            {data.documentationDeadlineAt && !data.documentationUnlock && data.noteStatus !== NOTE_STATUS.SIGNED ? (
              <p>{data.noteStatus === NOTE_STATUS.LOCKED ? t.visits.lockedNote : t.visits.documentationDeadline} · {formatDate(data.documentationDeadlineAt, undefined, lang)} · {formatTime(data.documentationDeadlineAt, undefined, lang)}</p>
            ) : null}
          </div> : null}


        </CardContent>
      </Card>

      {closed ? (
        <EmptyState icon={IconClinicalRecord} title={t.visits.closedVisit} description={t.visits.closedVisitDesc} />
      ) : (
        <Tabs defaultValue="note" className="min-w-0 flex-1 gap-3">
          <TabsList variant="document" className="shrink-0">
            <TabsTrigger value="note"><span className="max-w-full whitespace-normal break-words">{t.visits.note}</span><span className="max-w-full whitespace-normal break-words text-xs font-normal text-muted-foreground">{t.visits.noteStatuses[data.noteStatus]}</span></TabsTrigger>
            <TabsTrigger value="report"><span className="max-w-full whitespace-normal break-words">{t.visits.report}</span><span className="max-w-full whitespace-normal break-words text-xs font-normal text-muted-foreground">{t.visits.reportStatuses[data.reportStatus]}</span></TabsTrigger>
            <TabsTrigger value="invoice"><span className="max-w-full whitespace-normal break-words">{t.visits.invoice}</span><span className="max-w-full whitespace-normal break-words text-xs font-normal text-muted-foreground">{t.visits.invoiceStatuses[data.invoiceStatus]}</span></TabsTrigger>
          </TabsList>
          <Card className="min-w-0 flex-1 gap-0 py-0">
            <CardContent className="flex flex-1 flex-col p-3 sm:p-4">
              <TabsContent value="note" className="flex flex-1 flex-col [&>[role=status]]:flex-1">
                {data.note || user?.role === ROLE.PRACTITIONER ? (
                  <ClinicalNoteEditor appointmentId={appointmentId} workspace={data} templates={templates.data ?? []} />
                ) : (
                  <EmptyState icon={IconClinicalRecord} title={t.visits.note} description={t.visits.noteHidden} className="py-6" />
                )}
              </TabsContent>
              <TabsContent value="report" className="flex flex-1 flex-col [&>[role=status]]:flex-1">
                <MedicalReportEditor appointmentId={appointmentId} workspace={data} />
              </TabsContent>
              <TabsContent value="invoice" className="flex flex-1 flex-col [&>[role=status]]:flex-1">
                <InvoiceReview appointmentId={appointmentId} workspace={data} />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      )}

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
