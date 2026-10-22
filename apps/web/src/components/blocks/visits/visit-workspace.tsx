'use client';

import { useState, type ComponentProps, type ReactNode } from 'react';
import { APPOINTMENT_STATUS, NOTE_STATUS, PRESENCE_SOURCE, ROLE, SESSION_TYPE } from '@clinic/types';
import { Badge, Button, Card, CardContent, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import {
  EmptyState,
  ErrorState,
  FormSkeleton,
  VisitWorkspaceSkeleton,
  PageBack,
  OverflowActions,
  PhoneLink,
  PreviewableAvatar,
  ReasonDialog,
  VisitTimer,
} from '@/components/primitives';
import { IconCheck, IconCheckCircle, IconChevronDown, IconChevronUp, IconClinicalRecord, IconLock, IconOnline, IconPhone, IconPlay, IconUnlock } from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
import { useClinicRealtime } from '@/hooks/api/use-clinic-realtime';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { StatusBadgeBlock } from '@/components/blocks/appointments/shared/status-badge';
import { ageLabel } from '@/lib/age';
import { cn } from '@/lib/utils';
import { formatDate, formatTime } from '@/lib/datetime';
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
  const clinicId = useClinicId();
  useClinicRealtime(clinicId);
  const workspace = useVisitWorkspace(appointmentId);
  const data = workspace.data;
  const templates = useAvailableNoteTemplates(user?.role === ROLE.PRACTITIONER && data?.allowedActions.editNote ? appointmentId : '');
  const checkIn = useCheckIn(appointmentId);
  const start = useStartVisit(appointmentId);
  const finish = useFinishVisit(appointmentId);
  const unlock = useUnlockNote(appointmentId);
  const revoke = useRevokeUnlock(appointmentId);
  const [reasonMode, setReasonMode] = useState<'unlock' | 'revoke' | null>(null);
  const [factsOpen, setFactsOpen] = useState(true);

  if (workspace.isLoading) {
    return (
      <Tabs defaultValue="note" className="min-h-full w-full min-w-0 shrink-0 gap-3">
        <VisitWorkspaceHeader actions={<Skeleton className="h-8 w-24 rounded-lg" />} />
        <VisitWorkspaceSkeleton />
      </Tabs>
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
    <Tabs defaultValue="note" className="min-h-full w-full min-w-0 shrink-0 gap-3">
      <VisitWorkspaceHeader closed={closed} actions={showActions ? (<div className="flex items-center justify-end gap-2 sm:gap-3">
            {data.startedAt ? <VisitTimer serverNow={data.serverNow} startedAt={data.startedAt} finishedAt={data.finishedAt} durationMins={data.durationMins} compact /> : null}
            <div className="flex gap-2">
            {!closed && data.allowedActions.confirmPresence && !data.presenceConfirmedAt ? (
              <ActionButton icon={IconCheckCircle} label={t.visits.confirmPresence} disabled={checkIn.isPending} onClick={() => checkIn.mutate(presenceSource)} />
            ) : null}
            {!closed && data.allowedActions.start ? (
              <ActionButton icon={IconPlay} label={data.startedAt ? t.visits.resume : t.visits.start} disabled={start.isPending} onClick={() => start.mutate(data.appointmentRevision)} />
            ) : null}
            {!closed && data.allowedActions.finish && data.visitId ? (
              <ActionButton icon={IconCheck} label={t.visits.finish} disabled={finish.isPending} onClick={() => finish.mutate({ visitId: data.visitId!, expectedRevision: data.visitRevision })} />
            ) : null}
            {data.allowedActions.unlockNote && data.visitId ? (
              <ActionButton icon={IconUnlock} label={t.visits.unlock} variant="outline" onClick={() => setReasonMode('unlock')} />
            ) : null}
            {data.allowedActions.revokeUnlock && data.visitId ? (
              <ActionButton icon={IconLock} label={t.visits.revokeUnlock} variant="outline" onClick={() => setReasonMode('revoke')} />
            ) : null}
            </div>
          </div>) : undefined} />

      <Card className="gap-0 py-0">
        <CardContent className="flex flex-col p-3 sm:p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <PreviewableAvatar src={data.patient.imageUrl} seed={data.patient.id} size="lg" />
              <div className="min-w-0">
              <h1 className="truncate font-heading text-lg font-semibold tracking-tight sm:text-xl">{patientName}</h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {formatDate(data.scheduledAt, undefined, lang)} · {formatTime(data.scheduledAt, undefined, lang)} · {t.visits.plannedDuration.replace('{minutes}', String(data.durationMins))}
              </p>
            </div>
              </div>
            <div className="flex max-w-40 flex-col items-end gap-1.5 sm:max-w-none">
              <StatusBadgeBlock status={data.appointmentStatus} tip={false} />
            {data.mode === SESSION_TYPE.IN_PERSON ? (
              <Badge variant="outline" className="gap-1 px-1.5 text-[11px] leading-tight whitespace-normal text-end">{t.visits.inPerson}{data.room ? ` · ${roomName}` : ''}</Badge>
            ) : data.meetingUrl ? (
              <a href={data.meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary underline-offset-2 hover:underline">
                <IconOnline className="size-4" />{t.visits.join}
              </a>
            ) : (
              <Badge variant="warning"><IconOnline className="size-4" />{t.visits.joinMissing}</Badge>
            )}
            </div>
          </div>

          <div className={cn('grid transition-[grid-template-rows] duration-[var(--overlay-duration)] ease-[var(--overlay-ease)] motion-reduce:transition-none', factsOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
            <div className="min-h-0 overflow-hidden">
              <div className="pt-2 sm:pt-3">
              <dl className="grid grid-cols-2 items-start gap-x-4 gap-y-3 text-xs sm:text-sm lg:grid-cols-3 xl:grid-cols-6">
              <div className="min-w-0 space-y-1"><dt className="text-xs text-muted-foreground">{t.patient.practitioner}</dt><dd className="flex items-center gap-2 font-medium"><PreviewableAvatar src={data.practitioner.imageUrl} seed={data.practitioner.id} size="sm" />{getBilingualName(data.practitioner.name, data.practitioner.nameAr, lang)}</dd></div>
              {data.patientContext?.dob ? <div className="min-w-0 space-y-1"><dt className="text-xs text-muted-foreground">{t.patient.age}</dt><dd>{ageLabel(data.patientContext.dob, new Date(data.scheduledAt), t)}</dd></div> : null}
              {data.patientContext?.phone ? <div className="min-w-0 space-y-1"><dt className="text-xs text-muted-foreground">{t.patient.phone}</dt><dd className="flex items-center gap-2"><IconPhone className="size-4 shrink-0 text-muted-foreground" /><PhoneLink copyable value={data.patientContext.phone} /></dd></div> : null}
                {data.patientContext?.allergies ? <div className="min-w-0 space-y-1"><dt className="text-xs text-muted-foreground">{t.patient.allergies}</dt><dd className="whitespace-pre-wrap break-words font-medium text-warning">{data.patientContext.allergies}</dd></div> : null}
                {data.patientContext?.bloodType ? <div className="min-w-0 space-y-1"><dt className="text-xs text-muted-foreground">{t.patient.bloodType}</dt><dd><bdi dir="ltr">{data.patientContext.bloodType}</bdi></dd></div> : null}
              {data.service ? <div className="min-w-0 space-y-1"><dt className="text-xs text-muted-foreground">{t.entities.service}</dt><dd className="break-words font-medium">{getBilingualName(data.service.name, data.service.nameAr, lang)}</dd></div> : null}
            </dl>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 sm:mt-3">
  {data.documentationUnlock || (data.documentationDeadlineAt && !data.documentationUnlock && data.noteStatus !== NOTE_STATUS.SIGNED) ? <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
            {data.documentationUnlock ? <p>{t.visits.unlocked}: {data.documentationUnlock.reason}</p> : null}
            {data.documentationDeadlineAt && !data.documentationUnlock && data.noteStatus !== NOTE_STATUS.SIGNED ? (
              <p>{data.noteStatus === NOTE_STATUS.LOCKED ? t.visits.lockedNote : t.visits.documentationDeadline} · {formatDate(data.documentationDeadlineAt, undefined, lang)} · {formatTime(data.documentationDeadlineAt, undefined, lang)}</p>
            ) : null}
          </div> : null}
            <Button type="button" variant="ghost" size="icon-xs" className="ms-auto shrink-0" aria-expanded={factsOpen} aria-label={factsOpen ? t.layout.sidebar.collapse : t.layout.sidebar.expand} onClick={() => setFactsOpen((open) => !open)}>
              {factsOpen ? <IconChevronUp className="size-4" /> : <IconChevronDown className="size-4" />}
            </Button>
          </div>


        </CardContent>
      </Card>

      {closed ? (
        <EmptyState icon={IconClinicalRecord} title={t.visits.closedVisit} description={t.visits.closedVisitDesc} />
      ) : (
          <Card className="min-w-0 flex-1 gap-0 py-0">
            <CardContent className="flex flex-1 flex-col p-3 sm:p-4">
              <TabsContent value="note" className="flex flex-1 flex-col [&>[role=status]]:flex-1">
                {data.note || user?.role === ROLE.PRACTITIONER ? (
                  data.allowedActions.editNote && !data.note && templates.isPending ? (
                    <FormSkeleton fields={1} cols={1} hasActions={false} />
                  ) : data.allowedActions.editNote && templates.isError ? (
                    <ErrorState onRetry={() => void templates.refetch()} />
                  ) : <ClinicalNoteEditor appointmentId={appointmentId} workspace={data} templates={templates.data ?? []} />
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
    </Tabs>
  );
}

function VisitTabs({ variant }: { variant: 'pill' | 'fill' }) {
  const { t } = useLanguage();
  return (
    <TabsList variant={variant} className={variant === 'pill' ? 'w-full' : undefined}>
      <TabsTrigger value="note" className="flex-1">{t.visits.note}</TabsTrigger>
      <TabsTrigger value="report" className="flex-1">{t.visits.report}</TabsTrigger>
      <TabsTrigger value="invoice" className="flex-1">{t.visits.billing}</TabsTrigger>
    </TabsList>
  );
}

function VisitWorkspaceHeader({ closed = false, actions }: { closed?: boolean; actions?: ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <PageBack backHref={ROUTES.VISITS} />
      {!closed ? (
        <div className="order-last col-span-2 min-w-0 lg:order-none lg:col-span-1">
          <div className="lg:hidden"><VisitTabs variant="fill" /></div>
          <div className="hidden lg:block">
            <OverflowActions label={t.layout.titles.visit}><VisitTabs variant="pill" /></OverflowActions>
          </div>
        </div>
      ) : <div className="hidden lg:block" />}
      <div className="min-w-0 justify-self-end">{actions}</div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, ...props }: { icon: typeof IconPlay; label: string } & Omit<ComponentProps<typeof Button>, 'children'>) {
  return (
    <Button type="button" aria-label={label} className="max-sm:size-8 max-sm:px-0" {...props}>
      <Icon className="size-4" />
      <span className="max-sm:sr-only">{label}</span>
    </Button>
  );
}
