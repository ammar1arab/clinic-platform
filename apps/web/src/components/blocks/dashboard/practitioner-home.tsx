'use client';

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APPOINTMENT_STATUS } from '@clinic/types';
import { Button, Card, CardContent, CardTitle, Skeleton } from '@/components/ui';
import { CountBadge, EmptyState, EntityAvatar, ErrorState, LiveClock, PreviewableAvatar } from '@/components/primitives';
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

  if ((appointments.isError && !appointments.data) || (profile.isError && !profile.data)) {
    return <ErrorState onRetry={() => { void appointments.refetch(); void profile.refetch(); }} className="page-fill" />;
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
    <div className="fade-in flex min-h-full w-full min-w-0 shrink-0 flex-col gap-4 motion-reduce:animate-none sm:gap-5">
      <WelcomeCard
        name={getBilingualName(user?.name, user?.nameAr, lang)}
        imageUrl={practitioner?.imageUrl ?? user?.imageUrl}
        seed={user?.clinicUserId ?? 'practitioner'}
        facts={facts}
      />

      <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <KpiCardBlock label={t.dashboard.todaysAppointments} value={ordered.length} icon={IconTodaysAppointments} />
        <KpiCardBlock label={t.dashboard.waiting} value={waiting} icon={IconTimer} />
        <KpiCardBlock label={t.dashboard.completed} value={completed} icon={IconCheckCircle} />
        <KpiCardBlock label={t.queue.upcomingToday} value={nextVisit ? formatTime(nextVisit.scheduledAt, undefined, lang) : 0} icon={IconTime} />
      </div>

      <div className="grid min-w-0 flex-1 items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <HomeListCard
          title={t.dashboard.todaySchedule}
          count={<CountBadge count={ordered.length} />}
          footer={
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href={schedulePath('month')}><IconCalendarClock className="size-4" />{t.appointments.calendar}</Link>
            </Button>
          }
        >
          {ordered.length ? (
            <div className="space-y-2">
              {ordered.map((appointment) => (
                <button key={appointment.id} type="button" onClick={() => router.push(ROUTES.VISIT(appointment.id))} className={`${HOME_ROW_CLASS} group w-full text-start transition-colors hover:border-primary/25 hover:bg-muted/45`}>
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
        </HomeListCard>

        <HomeListCard
          title={t.dashboard.nextVisits}
          count={<CountBadge count={upcoming.length} />}
          footer={
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href={ROUTES.HOME_QUEUE}><IconTimer className="size-4" />{t.queue.waitingQueue}</Link>
            </Button>
          }
        >
          {upcoming.length ? (
            <div className="space-y-2">
              {upcoming.map((appointment) => (
                <Link key={appointment.id} href={ROUTES.VISIT(appointment.id)} className={`${HOME_ROW_CLASS} group text-sm transition-colors hover:border-primary/30 hover:bg-muted/45`}>
                  <EntityAvatar src={appointment.patient.imageUrl} seed={appointment.patientId} size="sm" className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium group-hover:text-primary">{getPersonName(appointment.patient, lang)}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{formatDate(appointment.scheduledAt, undefined, lang)}{appointment.service ? ` · ${getBilingualName(appointment.service.name, appointment.service.nameAr, lang)}` : ''}</p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-md bg-muted/60 px-2 py-1 text-xs font-medium tabular-nums">{formatTime(appointment.scheduledAt, undefined, lang)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState size="compact" icon={IconCalendarClock} title={t.appointments.noAppointments} description={t.appointments.noAppointmentsDesc} className="flex-1" />
          )}
        </HomeListCard>
      </div>
    </div>
  );
}

function WelcomeCard({
  loading = false,
  name,
  imageUrl,
  seed,
  facts,
}: {
  loading?: boolean;
  name: string;
  imageUrl?: string | null;
  seed: string;
  facts: { label: string; value: string }[];
}) {
  const { lang, t } = useLanguage();
  const today = new Date();
  return (
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
        {loading ? (
          <Skeleton className="size-12 shrink-0 rounded-full ring-2 ring-primary/15 sm:size-20" />
        ) : (
          <PreviewableAvatar src={imageUrl} seed={seed} size="xl" priority className="size-12 ring-2 ring-primary/15 sm:size-20" />
        )}
        <div className="min-w-0 text-start">
          <p className="text-xs font-medium text-muted-foreground">{formatDate(today, undefined, lang)}</p>
          <h1 className="break-words font-heading text-base font-semibold leading-tight tracking-tight sm:text-lg">{t.dashboard.welcome}, {name}</h1>
          <LiveClock className="mt-1" />
        </div>
        <dl className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-3 lg:col-span-1 lg:col-start-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="min-w-0 text-start">
              <dt className="text-2xs leading-tight text-muted-foreground">{fact.label}</dt>
              <dd className="mt-0.5 break-words text-xs font-medium leading-snug text-foreground">
                {loading ? <Skeleton className="h-[1.03rem] w-24 max-w-full" /> : fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

const HOME_CARD_CLASS = 'card-aura relative isolate flex min-w-0 flex-col gap-0 overflow-hidden py-0 ring-0';
const HOME_CARD_HEADER = 'flex min-h-10 items-center justify-between gap-3 p-3 pt-4 sm:p-4 sm:pt-5';
const HOME_CARD_BODY = 'flex flex-1 flex-col gap-2 px-3 pb-3 sm:px-4 sm:pb-4';
const HOME_CARD_FOOTER = 'mt-auto pt-2';
const HOME_ROW_CLASS = 'flex h-[4.5rem] items-center gap-3 rounded-xl border border-border/70 px-3 py-3';

function HomeListCard({
  title,
  count,
  footer,
  children,
}: {
  title: ReactNode;
  count: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className={HOME_CARD_CLASS}>
      <div className={HOME_CARD_HEADER}>
        <CardTitle className="min-w-0 truncate text-base">{title}</CardTitle>
        {count}
      </div>
      <div className={HOME_CARD_BODY}>
        {children}
        <div className={HOME_CARD_FOOTER}>{footer}</div>
      </div>
    </Card>
  );
}

function PractitionerHomeSkeleton() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  return (
    <div className="fade-in flex min-h-full w-full min-w-0 shrink-0 flex-col gap-4 motion-reduce:animate-none sm:gap-5" aria-hidden>
      <WelcomeCard
        loading
        name={getBilingualName(user?.name, user?.nameAr, lang)}
        seed={user?.clinicUserId ?? 'practitioner'}
        facts={[t.exports.specialty, t.exports.department, t.exports.room, t.exports.experience].map((label) => ({ label, value: '' }))}
      />

      <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <KpiCardBlock label={t.dashboard.todaysAppointments} value={undefined} isLoading icon={IconTodaysAppointments} />
        <KpiCardBlock label={t.dashboard.waiting} value={undefined} isLoading icon={IconTimer} />
        <KpiCardBlock label={t.dashboard.completed} value={undefined} isLoading icon={IconCheckCircle} />
        <KpiCardBlock label={t.queue.upcomingToday} value={undefined} isLoading icon={IconTime} />
      </div>

      <div className="grid min-w-0 flex-1 items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <HomeListCard
          title={t.dashboard.todaySchedule}
          count={<Skeleton className="h-5 min-w-5 w-6 rounded-full" />}
          footer={
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href={schedulePath('month')}><IconCalendarClock className="size-4" />{t.appointments.calendar}</Link>
            </Button>
          }
        >
          <div className="space-y-2">
            {[0, 1, 2].map((row) => (
              <div key={row} className={`${HOME_ROW_CLASS} items-center`}>
                <Skeleton className="h-9 w-14 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-28 max-w-full" />
                  <Skeleton className="h-3 w-36 max-w-full" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </HomeListCard>

        <HomeListCard
          title={t.dashboard.nextVisits}
          count={<Skeleton className="h-5 min-w-5 w-6 rounded-full" />}
          footer={
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href={ROUTES.HOME_QUEUE}><IconTimer className="size-4" />{t.queue.waitingQueue}</Link>
            </Button>
          }
        >
          <div className="space-y-2">
            {[0, 1, 2].map((row) => (
              <div key={row} className={HOME_ROW_CLASS}>
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-28 max-w-full" />
                  <Skeleton className="h-3 w-36 max-w-full" />
                </div>
                <Skeleton className="h-6 w-14 rounded-md" />
              </div>
            ))}
          </div>
        </HomeListCard>
      </div>
    </div>
  );
}
