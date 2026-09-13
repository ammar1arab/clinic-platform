'use client';

import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { KpiCardBlock } from '@/components/blocks/dashboard';
import { IconCalendarClock, IconPatients, IconPlay, IconPractitioner } from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
import { useAppointments } from '@/hooks/api/use-appointments';
import { useAuth, useLanguage } from '@/providers';
import { APPOINTMENT_STATUS, type AppointmentStatus } from '@clinic/types';

export default function PractitionerHomePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const { data: appointments, isLoading } = useAppointments({ startDate: today, endDate: today }, !!user);
  const waiting = appointments?.filter((appointment) => appointment.status === APPOINTMENT_STATUS.WAITING || appointment.status === APPOINTMENT_STATUS.CHECKED_IN).length ?? 0;
  const inProgress = appointments?.filter((appointment) => appointment.status === APPOINTMENT_STATUS.IN_PROGRESS).length ?? 0;
  const completed = appointments?.filter((appointment) => appointment.status === APPOINTMENT_STATUS.COMPLETED).length ?? 0;
  const upcomingStatuses: AppointmentStatus[] = [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.UNCONFIRMED, APPOINTMENT_STATUS.CHECKED_IN, APPOINTMENT_STATUS.WAITING];
  const next = appointments?.find((appointment) => upcomingStatuses.includes(appointment.status));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <Card className="card-aura overflow-hidden border-border bg-card">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t.layout.titles.home}</p>
            <CardTitle className="mt-1 text-2xl">{user?.name}</CardTitle>
          </div>
          <Button asChild><Link href={ROUTES.HOME_QUEUE}><IconPatients />{t.queue.waitingQueue}</Link></Button>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline"><Link href={ROUTES.HOME_PROFILE}><IconPractitioner />{t.practitioner.profile}</Link></Button>
          {next ? <span className="flex items-center gap-2 text-sm text-muted-foreground"><IconCalendarClock className="text-primary" />{next.patient.firstNameEn} {next.patient.lastNameEn}</span> : null}
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCardBlock label={t.queue.waiting} value={waiting} icon={IconPatients} accent="warning" isLoading={isLoading} />
        <KpiCardBlock label={t.queue.inSession} value={inProgress} icon={IconPlay} accent="default" isLoading={isLoading} />
        <KpiCardBlock label={t.queue.completed} value={completed} icon={IconCalendarClock} accent="success" isLoading={isLoading} />
      </div>
    </div>
  );
}
