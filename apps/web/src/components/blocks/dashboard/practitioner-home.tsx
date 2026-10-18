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
import { formatDate, formatTime } from '@/lib/datetime';
import { getBilingualName, getPersonName } from '@/i18n';
import { schedulePath } from '@/components/blocks/appointments/schedule/schedule-nav';
import {
  IconCalendarClock,
  IconCheckCircle,
  IconRoom,
  IconService,
  IconTime,
  IconTimer,
  IconTodaysAppointments,
} from '@/constants/icons';

export function PractitionerHome() {
  const clinicId = useClinicId();
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const appointments = useAppointments(
    { startDate: today, endDate: today, doctorId: user?.clinicUserId },
    Boolean(user?.clinicUserId),
  );
  const profile = usePractitioner(user?.clinicUserId ?? '');

  useClinicRealtime(clinicId, { notifyOnAppointmentChange: true });

  const ordered = useMemo(
    () => [...(appointments.data ?? [])].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
    [appointments.data],
  );
  const waiting = ordered.filter((item) =>
    item.status === APPOINTMENT_STATUS.WAITING || item.status === APPOINTMENT_STATUS.CHECKED_IN,
  ).length;
  const completed = ordered.filter((item) => item.status === APPOINTMENT_STATUS.COMPLETED).length;
  const nextVisit = ordered.find((item) =>
    item.status !== APPOINTMENT_STATUS.COMPLETED &&
    item.status !== APPOINTMENT_STATUS.CANCELLED &&
    item.status !== APPOINTMENT_STATUS.NO_SHOW,
  );

  if (appointments.isError && !appointments.data) {
    return <ErrorState onRetry={() => void appointments.refetch()} className="page-fill" />;
  }

  const practitioner = profile.data;
  const specialty = practitioner
    ? getBilingualName(practitioner.specialty, practitioner.specialtyAr, lang)
    : '';
  const room = practitioner
    ? getBilingualName(practitioner.defaultRoomName, practitioner.defaultRoomNameAr, lang)
    : '';

  return (
    <div className="page-stack gap-5">
      <Card className="card-aura overflow-hidden ring-0">
        <CardContent className="flex items-center gap-4 p-5 sm:p-6">
          {profile.isLoading ? (
            <Skeleton className="size-14 shrink-0 rounded-full" />
          ) : (
            <PreviewableAvatar src={practitioner?.imageUrl ?? user?.imageUrl} seed={user?.clinicUserId ?? 'practitioner'} size="lg" priority />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{formatDate(today, undefined, lang)}</p>
            <h1 className="mt-1 truncate font-heading text-xl font-semibold tracking-tight sm:text-2xl">{t.dashboard.welcome}, {getBilingualName(user?.name, user?.nameAr, lang)}</h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">{[specialty, room].filter(Boolean).join(' · ')}</p>
          </div>
          <IconWell icon={IconTodaysAppointments} accent="default" className="hidden sm:grid" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCardBlock label={t.dashboard.todaysAppointments} value={appointments.data?.length} icon={IconTodaysAppointments} accent="default" isLoading={appointments.isLoading} />
        <KpiCardBlock label={t.dashboard.waiting} value={waiting} icon={IconTimer} accent="warning" isLoading={appointments.isLoading} />
        <KpiCardBlock label={t.dashboard.completed} value={completed} icon={IconCheckCircle} accent="success" isLoading={appointments.isLoading} />
        <KpiCardBlock label={t.queue.upcomingToday} value={nextVisit ? formatTime(nextVisit.scheduledAt, undefined, lang) : '—'} icon={IconTime} accent="teal" isLoading={appointments.isLoading} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,.55fr)]">
        <Card className="card-aura ring-0">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <div className="flex min-w-0 items-center gap-3">
              <IconWell icon={IconCalendarClock} accent="violet" />
              <div>
                <CardTitle className="text-base">{t.dashboard.todaySchedule}</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">{ordered.length} {t.dashboard.todaysAppointments.toLowerCase()}</p>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={schedulePath('month')}>{t.appointments.calendar}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {appointments.isLoading ? (
              <div className="space-y-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-[4.5rem] w-full rounded-xl" />)}</div>
            ) : ordered.length ? (
              <div className="space-y-2">
                {ordered.map((appointment) => (
                  <button key={appointment.id} type="button" onClick={() => router.push(`${ROUTES.SCHEDULE_EDIT(appointment.id)}?view=month`)} className="group flex w-full items-center gap-3 rounded-xl border border-border/70 px-3 py-3 text-start transition-colors hover:border-primary/25 hover:bg-muted/45">
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
              <EmptyState size="compact" icon={IconCalendarClock} title={t.appointments.noAppointments} description={t.appointments.noAppointmentsDesc} />
            )}
          </CardContent>
        </Card>

        <Card className="card-aura ring-0">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <IconWell icon={IconService} accent="teal" />
            <CardTitle className="text-base">{t.practitioner.overview}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <HomeDetail icon={IconRoom} label={t.practitioner.defaultRoom} value={room} loading={profile.isLoading} />
            <HomeDetail icon={IconService} label={t.practitioner.services} value={practitioner?.services.map((service) => getBilingualName(service.name, service.nameAr, lang)).join(', ')} loading={profile.isLoading} />
            <HomeDetail icon={IconCalendarClock} label={t.practitioner.workingDays} value={practitioner ? String(new Set(practitioner.availabilities.map((slot) => slot.dayOfWeek)).size) : ''} loading={profile.isLoading} />
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link href={ROUTES.HOME_QUEUE}><IconTimer className="size-4" />{t.queue.waitingQueue}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HomeDetail({ icon, label, value, loading }: { icon: typeof IconRoom; label: string; value?: string | null; loading: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/70 p-3">
      <IconWell icon={icon} size="sm" accent="muted" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {loading ? <Skeleton className="mt-1.5 h-4 w-28" /> : <p className="mt-0.5 line-clamp-2 text-sm font-medium">{value || '—'}</p>}
      </div>
    </div>
  );
}
