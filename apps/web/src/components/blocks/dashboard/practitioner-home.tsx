'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { APPOINTMENT_STATUS } from '@clinic/types';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/primitives';
import { StatusBadgeBlock } from '@/components/blocks/appointments/shared/status-badge';
import { useAppointments } from '@/hooks/api/use-appointments';
import { useClinicRealtime } from '@/hooks/api/use-clinic-realtime';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useAuth, useLanguage } from '@/providers';
import { ROUTES } from '@/constants/routes';
import { formatDate, formatTime } from '@/lib/datetime';
import { getBilingualName, getPersonName } from '@/i18n';
import { IconCalendarClock, IconCheckCircle, IconTimer, IconTodaysAppointments } from '@/constants/icons';

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

  return (
    <div className="page-stack gap-5">
      <section className="rounded-2xl border border-border bg-card px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.dashboard.todaySchedule}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{t.dashboard.welcome}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{formatDate(today, undefined, lang)}</p>
          </div>
          {nextVisit ? (
            <button type="button" onClick={() => router.push(`${ROUTES.SCHEDULE_EDIT(nextVisit.id)}?view=month`)} className="rounded-xl border border-primary/25 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5">
              {t.appointments.openAppointment}
            </button>
          ) : null}
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <HomeMetric icon={IconTodaysAppointments} label={t.dashboard.todaysAppointments} value={appointments.data?.length} loading={appointments.isLoading} />
        <HomeMetric icon={IconTimer} label={t.dashboard.waiting} value={waiting} loading={appointments.isLoading} />
        <HomeMetric icon={IconCheckCircle} label={t.dashboard.completed} value={completed} loading={appointments.isLoading} />
      </div>

      <Card className="card-aura ring-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t.dashboard.todaySchedule}</CardTitle>
          <IconCalendarClock className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {appointments.isLoading ? (
            <div className="space-y-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-16 w-full rounded-xl" />)}</div>
          ) : ordered.length ? (
            <div className="space-y-2">
              {ordered.map((appointment) => (
                <button key={appointment.id} type="button" onClick={() => router.push(`${ROUTES.SCHEDULE_EDIT(appointment.id)}?view=month`)} className="flex w-full items-center gap-3 rounded-xl border border-border/70 px-3 py-3 text-start transition-colors hover:bg-muted/50">
                  <span className="w-14 shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatTime(appointment.scheduledAt, undefined, lang)}</span>
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
    </div>
  );
}

function HomeMetric({ icon: Icon, label, value, loading }: { icon: typeof IconCalendarClock; label: string; value?: number; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-4 sm:px-4">
      <Icon className="size-4 text-primary" />
      <p className="mt-3 text-2xl font-semibold tabular-nums">{loading ? <Skeleton className="h-7 w-10" /> : value ?? 0}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
