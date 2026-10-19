'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APPOINTMENT_STATUS } from '@clinic/types';
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { EmptyState, ErrorState, IconWell, PreviewableAvatar } from '@/components/primitives';
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
  IconCalendarClock,
  IconCheckCircle,
  IconTime,
  IconTimer,
  IconTodaysAppointments,
} from '@/constants/icons';

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
    item.status !== APPOINTMENT_STATUS.NO_SHOW,
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
  const lastCompleted = [...ordered]
    .filter((item) => item.status === APPOINTMENT_STATUS.COMPLETED)
    .at(-1);

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

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 pb-6 xl:page-fill xl:pb-0">
      <Card className="card-aura relative isolate shrink-0 gap-0 overflow-hidden py-0 ring-0">
        <CardContent className="relative z-10 flex flex-row items-center gap-3 px-3 pb-20 pt-5 sm:gap-4 sm:px-4 sm:pt-6 lg:py-8 lg:pe-[min(30%,24rem)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="welcome-ambient absolute -inset-12" />
          <svg viewBox="0 0 360 120" fill="none" className="absolute inset-x-3 bottom-0 h-20 w-[calc(100%_-_1.5rem)] text-primary lg:inset-x-auto lg:inset-y-0 lg:end-2 lg:h-full lg:w-[28%] rtl:-scale-x-100">
            <path d="M0 68h76l12-12 15 26 20-52 20 71 17-33h200" stroke="currentColor" strokeOpacity="0.12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path className="welcome-trace" pathLength="1" d="M0 68h76l12-12 15 26 20-52 20 71 17-33h200" stroke="currentColor" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle className="welcome-beacon" cx="276" cy="68" r="16" fill="currentColor" fillOpacity="0.08" />
            <circle cx="276" cy="68" r="4" fill="currentColor" fillOpacity="0.55" />
          </svg>
        </div>
          {profile.isLoading ? (
            <Skeleton className="size-16 shrink-0 rounded-full sm:size-20" />
          ) : (
            <PreviewableAvatar src={practitioner?.imageUrl ?? user?.imageUrl} seed={user?.clinicUserId ?? 'practitioner'} size="xl" priority className="size-16 ring-2 ring-primary/15 sm:size-20" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">{formatDate(today, undefined, lang)}</p>
            <h1 className="break-words font-heading text-base font-semibold leading-tight tracking-tight sm:text-lg">{t.dashboard.welcome}, {getBilingualName(user?.name, user?.nameAr, lang)}</h1>
            {lastCompleted ? (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-xs">
                {t.patient.lastVisit}: {getPersonName(lastCompleted.patient, lang)} · {formatTime(lastCompleted.scheduledAt, undefined, lang)}
              </p>
            ) : null}
            <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {specialty ? <WelcomeFact label={t.exports.specialty} value={specialty} /> : null}
              {department ? <WelcomeFact label={t.exports.department} value={department} /> : null}
              {room ? <WelcomeFact label={t.exports.room} value={room} /> : null}
              {practitioner?.experienceYears != null ? <WelcomeFact label={t.exports.experience} value={`${practitioner.experienceYears} ${t.common.years}`} /> : null}
            </div>
          </div>

        </CardContent>
      </Card>

      <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <KpiCardBlock label={t.dashboard.todaysAppointments} value={ordered.length} icon={IconTodaysAppointments} accent="default" isLoading={appointments.isLoading} />
        <KpiCardBlock label={t.dashboard.waiting} value={waiting} icon={IconTimer} accent="warning" isLoading={appointments.isLoading} />
        <KpiCardBlock label={t.dashboard.completed} value={completed} icon={IconCheckCircle} accent="success" isLoading={appointments.isLoading} />
        <KpiCardBlock label={t.queue.upcomingToday} value={nextVisit ? formatTime(nextVisit.scheduledAt, undefined, lang) : 0} icon={IconTime} accent="teal" isLoading={appointments.isLoading} />
      </div>

      <div className="grid min-w-0 items-stretch gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <Card className="card-aura flex min-w-0 flex-col ring-0 xl:min-h-0 xl:overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 p-5 sm:p-6">
            <div className="flex min-w-0 items-center gap-3">
              <IconWell icon={IconCalendarClock} accent="violet" />
              <div>
                <CardTitle className="text-base">{t.dashboard.todaySchedule}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{nextVisit ? `${t.queue.upcomingToday}: ${formatTime(nextVisit.scheduledAt, undefined, lang)}` : t.appointments.noAppointments}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col px-5 pb-5 sm:px-6 sm:pb-6 xl:min-h-0 xl:flex-1">
            {appointments.isLoading ? (
              <div className="space-y-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-[4.5rem] w-full rounded-xl" />)}</div>
            ) : ordered.length ? (
              <div className="space-y-2 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
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
              <div className="py-2 sm:py-4">
                <EmptyState size="compact" icon={IconCalendarClock} title={t.appointments.noAppointments} description={t.appointments.noAppointmentsDesc} />
              </div>
            )}
            <div className="mt-auto shrink-0 pt-4">
              <Button asChild variant="outline" className="w-full gap-2">
                <Link href={schedulePath('month')}><IconCalendarClock className="size-4" />{t.appointments.calendar}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-aura flex min-w-0 flex-col ring-0 xl:min-h-0 xl:overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-5 sm:p-6">
            <IconWell icon={IconTime} accent="teal" />
            <CardTitle className="text-base">{t.dashboard.nextVisits}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-5 pb-5 sm:px-6 sm:pb-6 xl:min-h-0 xl:flex-1">
            {upcoming.length ? <div className="space-y-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">{upcoming.map((appointment) => (
              <Link key={appointment.id} href={ROUTES.VISIT(appointment.id)} className="flex min-w-0 flex-col gap-1 rounded-xl border border-border/70 p-3.5 text-sm transition-colors hover:bg-muted/45 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span className="min-w-0 truncate font-medium">{getPersonName(appointment.patient, lang)}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatDate(appointment.scheduledAt, undefined, lang)} · {formatTime(appointment.scheduledAt, undefined, lang)}</span>
              </Link>
            ))}</div> : <EmptyState size="compact" icon={IconCalendarClock} title={t.appointments.noAppointments} description={t.appointments.noAppointmentsDesc} className="xl:min-h-0 xl:flex-1" />}
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

function WelcomeFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 shrink-0 rounded-md bg-muted/50 px-2 py-1">
      <p className="truncate text-[10px] leading-tight text-muted-foreground">{label}</p>
      <p className="max-w-36 truncate text-xs font-medium leading-tight text-foreground sm:max-w-44">{value}</p>
    </div>
  );
}

function PractitionerHomeSkeleton() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4 pb-6 xl:page-fill xl:pb-0" aria-hidden>
      <Card className="shrink-0 gap-0 overflow-hidden py-0 ring-0">
        <CardContent className="flex items-center gap-3 px-3 pb-20 pt-5 sm:gap-4 sm:px-4 sm:pt-6 lg:py-8 lg:pe-[min(30%,24rem)]">
          <Skeleton className="size-16 shrink-0 rounded-full sm:size-20" />
          <div className="min-w-0 flex-1 space-y-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-full max-w-sm sm:h-6" />
            <div className="flex gap-2 overflow-hidden pt-1">
              {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-9 w-28 shrink-0 rounded-lg" />)}
            </div>
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

      <div className="grid min-w-0 items-stretch gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
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
              <div key={item} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
            <div className="mt-auto border-t border-border/70 pt-4"><Skeleton className="mb-3 h-4 w-20" /><Skeleton className="h-9 w-full rounded-lg" /></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
