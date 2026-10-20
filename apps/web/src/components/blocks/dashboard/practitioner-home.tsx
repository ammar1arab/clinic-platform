'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APPOINTMENT_STATUS } from '@clinic/types';
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { EmptyState, EntityAvatar, ErrorState, IconWell, LiveClock, PreviewableAvatar } from '@/components/primitives';
import { StatusBadgeBlock } from '@/components/blocks/appointments/shared/status-badge';
import { KpiCardBlock } from './kpi-card';
import { useAppointments } from '@/hooks/api/use-appointments';
import { useClinicRealtime } from '@/hooks/api/use-clinic-realtime';
import { usePractitioner } from '@/hooks/api/use-practitioners';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useAuth, useLanguage } from '@/providers';
import { ROUTES } from '@/constants/routes';
import { formatDate, formatTime, todayAppointmentRange } from '@/lib/datetime';
import { getBilingualName, getPersonName } from '@/i18n';
import { schedulePath } from '@/components/blocks/appointments/schedule/schedule-nav';
import {
  IconHeart,
  IconCalendarClock,
  IconCheckCircle,
  IconTime,
  IconTimer,
  IconTodaysAppointments,
} from '@/constants/icons';

const WELCOME_PULSE = 'M0 20h110l10-4 12 10 16-23 17 31 13-14h182';

export function PractitionerHome() {
  const clinicId = useClinicId();
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const router = useRouter();
  const today = new Date();
  const dayRange = todayAppointmentRange(14);
  const todayEnd = todayAppointmentRange().endDate;
  const appointments = useAppointments(
    { ...dayRange, doctorId: user?.clinicUserId },
    Boolean(user?.clinicUserId),
  );
  const profile = usePractitioner(user?.clinicUserId ?? '');

  useClinicRealtime(clinicId, { notifyOnAppointmentChange: true });

  const ordered = useMemo(
    () => (appointments.data ?? []).filter((item) => item.scheduledAt <= todayEnd),
    [appointments.data, todayEnd],
  );
  const upcoming = (appointments.data ?? []).filter((item) =>
    item.scheduledAt > todayEnd &&
    item.status !== APPOINTMENT_STATUS.CANCELLED &&
    item.status !== APPOINTMENT_STATUS.NO_SHOW &&
    item.status !== APPOINTMENT_STATUS.COMPLETED,
  ).slice(0, 3);
  const waiting = ordered.filter((item) =>
    item.status === APPOINTMENT_STATUS.WAITING || item.status === APPOINTMENT_STATUS.CHECKED_IN,
  ).length;
  const completed = ordered.filter((item) => item.status === APPOINTMENT_STATUS.COMPLETED).length;
  const nextVisit = ordered.find((item) =>
    new Date(item.scheduledAt).getTime() >= today.getTime() &&
    item.status !== APPOINTMENT_STATUS.COMPLETED &&
    item.status !== APPOINTMENT_STATUS.CANCELLED &&
    item.status !== APPOINTMENT_STATUS.NO_SHOW,
  );

  if (appointments.isError && !appointments.data) {
    return <ErrorState onRetry={() => void appointments.refetch()} className="page-fill" />;
  }

  if ((appointments.isLoading && !appointments.data) || (profile.isLoading && !profile.data)) {
    return <PractitionerHomeSkeleton />;
  }

  const practitioner = profile.data;
  const specialty = practitioner
    ? getBilingualName(practitioner.specialty, practitioner.specialtyAr, lang)
    : '';
  const room = practitioner
    ? getBilingualName(practitioner.defaultRoomName, practitioner.defaultRoomNameAr, lang)
    : '';
  const department = practitioner
    ? getBilingualName(practitioner.departmentName, practitioner.departmentNameAr, lang)
    : '';

  const facts = [
    { label: t.exports.specialty, value: specialty },
    { label: t.exports.department, value: department },
    { label: t.exports.room, value: room },
    { label: t.exports.experience, value: practitioner?.experienceYears != null ? `${practitioner.experienceYears} ${t.common.years}` : '' },
  ].filter((fact) => fact.value);

  return (
    <div className="flex min-h-full w-full min-w-0 shrink-0 flex-col gap-2.5 pb-6">
      <Card className="card-aura relative isolate shrink-0 gap-0 overflow-hidden py-0 ring-0">
        <CardContent className="relative z-10 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 p-3 pb-14 pt-4 sm:gap-4 sm:p-4 sm:pb-14 sm:pt-5 lg:pb-5 lg:pe-[min(30%,24rem)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="welcome-ambient absolute inset-0" />
            <div className="absolute inset-x-4 bottom-3 flex h-8 items-center gap-3 text-primary lg:inset-x-auto lg:inset-y-0 lg:end-5 lg:h-full lg:w-[25%]">
              <svg viewBox="0 0 360 40" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-full min-w-0 flex-1 rtl:-scale-x-100 lg:h-16">
                <path d={WELCOME_PULSE} strokeOpacity="0.15" vectorEffect="non-scaling-stroke" />
                <path d={WELCOME_PULSE} className="welcome-trace" pathLength="1" vectorEffect="non-scaling-stroke" />
              </svg>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/5 ring-1 ring-primary/10 lg:size-12"><IconHeart className="size-4 text-primary/70 lg:size-6" strokeWidth={1.5} /></span>
            </div>
          </div>
          <PreviewableAvatar src={practitioner?.imageUrl ?? user?.imageUrl} seed={user?.clinicUserId ?? 'practitioner'} size="xl" priority className="size-12 ring-2 ring-primary/15 sm:size-20" />
          <div className="min-w-0 text-start">
            <p className="text-xs font-medium text-muted-foreground">{formatDate(today, undefined, lang)}</p>
            <h1 className="break-words font-heading text-base font-semibold leading-tight tracking-tight sm:text-lg">{t.dashboard.welcome}, {getBilingualName(user?.name, user?.nameAr, lang)}</h1>
            <LiveClock className="mt-1" />
          </div>
          <dl className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-3 lg:col-span-1 lg:col-start-2 lg:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label} className="min-w-0 text-start">
                  <dt className="text-[10px] leading-tight text-muted-foreground">{fact.label}</dt>
                  <dd className="mt-0.5 break-words text-xs font-medium leading-snug text-foreground">{fact.value}</dd>
                </div>
              ))}
          </dl>
        </CardContent>
      </Card>

      <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <KpiCardBlock label={t.dashboard.todaysAppointments} value={ordered.length} icon={IconTodaysAppointments} accent="default" />
        <KpiCardBlock label={t.dashboard.waiting} value={waiting} icon={IconTimer} accent="warning" />
        <KpiCardBlock label={t.dashboard.completed} value={completed} icon={IconCheckCircle} accent="success" />
        <KpiCardBlock label={t.queue.upcomingToday} value={nextVisit ? formatTime(nextVisit.scheduledAt, undefined, lang) : 0} icon={IconTime} accent="teal" />
      </div>

      <div className="grid min-w-0 flex-1 items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <Card className="card-aura flex min-w-0 flex-col ring-0">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 p-5 sm:p-6">
            <div className="flex min-w-0 items-center gap-3">
              <IconWell icon={IconCalendarClock} accent="violet" />
              <div>
                <CardTitle className="text-base">{t.dashboard.todaySchedule}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{nextVisit ? `${t.queue.upcomingToday}: ${formatTime(nextVisit.scheduledAt, undefined, lang)}` : t.appointments.noAppointments}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col px-5 pb-5 sm:px-6 sm:pb-6">
            {ordered.length ? (
              <div className="space-y-2">
                {ordered.map((appointment) => (
                  <button key={appointment.id} type="button" onClick={() => router.push(ROUTES.VISIT(appointment.id))} className="group flex w-full items-center gap-3 rounded-xl border border-border/70 px-3 py-3 text-start transition-colors hover:border-primary/25 hover:bg-muted/45">
                    <span className="grid min-w-14 shrink-0 place-items-center rounded-lg bg-muted px-2 py-2 text-sm font-semibold tabular-nums text-foreground">{formatTime(appointment.scheduledAt, undefined, lang)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{getPersonName(appointment.patient, lang)}</span>
                      <span className="block truncate text-xs text-muted-foreground">{appointment.service ? getBilingualName(appointment.service.name, appointment.service.nameAr, lang) : t.appointments.appointment}</span>
                    </span>
                    <StatusBadgeBlock status={appointment.status} compact tip={false} />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState size="compact" icon={IconCalendarClock} title={t.appointments.noAppointments} description={t.appointments.noAppointmentsDesc} className="flex-1" />
            )}
            <div className="mt-auto shrink-0 border-t border-border/70 pt-4">
              <p className="mb-3 text-sm text-muted-foreground">{t.appointments.today}: <span className="font-semibold tabular-nums text-foreground">{ordered.length}</span></p>
              <Button asChild variant="outline" className="w-full gap-2">
                <Link href={schedulePath('month')}><IconCalendarClock className="size-4" />{t.appointments.calendar}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-aura flex min-w-0 flex-col ring-0">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-5 sm:p-6">
            <IconWell icon={IconTime} accent="teal" />
            <CardTitle className="text-base">{t.dashboard.nextVisits}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
            {upcoming.length ? <div className="space-y-3">{upcoming.map((appointment) => (
              <Link key={appointment.id} href={ROUTES.VISIT(appointment.id)} className="group flex min-w-0 items-center gap-3 rounded-xl border border-border/70 p-3 text-sm transition-colors hover:border-primary/30 hover:bg-muted/45">
                <EntityAvatar src={appointment.patient.imageUrl} seed={appointment.patientId} size="sm" className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium group-hover:text-primary">{getPersonName(appointment.patient, lang)}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{formatDate(appointment.scheduledAt, undefined, lang)}{appointment.service ? ` · ${getBilingualName(appointment.service.name, appointment.service.nameAr, lang)}` : ''}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap rounded-md bg-muted/60 px-2 py-1 text-xs font-medium tabular-nums">{formatTime(appointment.scheduledAt, undefined, lang)}</span>
              </Link>
            ))}</div> : <EmptyState size="compact" icon={IconCalendarClock} title={t.appointments.noAppointments} description={t.appointments.noAppointmentsDesc} className="flex-1" />}
            <div className="mt-auto shrink-0 border-t border-border/70 pt-4">
              <p className="mb-3 text-sm text-muted-foreground">{t.dashboard.waiting}: <span className="font-semibold tabular-nums text-foreground">{waiting}</span></p>
              <Button asChild variant="outline" className="w-full gap-2">
                <Link href={ROUTES.HOME_QUEUE}><IconTimer className="size-4" />{t.queue.waitingQueue}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PractitionerHomeSkeleton() {
  return (
    <div className="flex min-h-full w-full min-w-0 shrink-0 flex-col gap-2.5 pb-6" aria-hidden>
      <Card className="gap-0 overflow-hidden py-0 ring-0">
        <CardContent className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 p-3 pb-14 pt-4 sm:gap-4 sm:p-4 sm:pb-14 sm:pt-5 lg:pb-5 lg:pe-[min(30%,24rem)]">
          <Skeleton className="size-12 shrink-0 rounded-full sm:size-20" />
          <div className="min-w-0 space-y-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-full max-w-sm sm:h-6" />
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-3 lg:col-span-1 lg:col-start-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-10 w-full" />)}
            </div>
        </CardContent>
      </Card>

      <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="flex min-h-[6.5rem] items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5">
            <Skeleton className="size-12 shrink-0 rounded-xl sm:size-14" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-3 w-full max-w-24" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid min-w-0 flex-1 items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <Card className="flex min-w-0 flex-col ring-0">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 shrink-0 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex h-[4.5rem] items-center gap-3 rounded-xl border border-border/70 p-3">
                <Skeleton className="h-10 w-14 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-36 max-w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
            <div className="mt-auto pt-4"><Skeleton className="h-9 w-full rounded-lg" /></div>
          </CardContent>
        </Card>

        <Card className="flex min-w-0 flex-col ring-0">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-5 sm:p-6">
            <Skeleton className="size-12 shrink-0 rounded-xl" />
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 px-5 pb-5 sm:px-6 sm:pb-6">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-4 w-28 max-w-full" /><Skeleton className="h-3 w-36 max-w-full" /></div>
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
            ))}
            <div className="mt-auto border-t border-border/70 pt-4"><Skeleton className="mb-3 h-4 w-20" /><Skeleton className="h-9 w-full rounded-lg" /></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
