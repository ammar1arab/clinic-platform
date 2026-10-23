'use client';

import { useState, type ComponentProps } from 'react';
import { useDashboardKpis, useRoomUtilization, useDashboardRealtime } from '@/hooks/api/use-dashboard';
import { KpiCardBlock } from './kpi-card';
import { RoomUtilizationCardBlock } from './room-utilization-card';
import { ViewFocus } from '@/components/blocks/appointments';
import { schedulePath } from '@/components/blocks/appointments/schedule/schedule-nav';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { formatWaitingMins } from '@/lib/waiting-time';
import { IconCheckCircle, IconDepartment, IconHourglass, IconNoteCard, IconPackage, IconPatients, IconPractitioner, IconRoom, IconService, IconTime, IconTimer, IconTodaysAppointments } from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
import { canSeeNavHref } from '@/constants/nav-access';
import { createHref } from '@/hooks/shared/use-create-dialog';
import { usePatients } from '@/hooks/api/use-patients';
import { usePractitioners } from '@/hooks/api/use-practitioners';
import { useDepartments } from '@/hooks/api/use-departments';
import { useServices } from '@/hooks/api/use-services';
import { usePackages } from '@/hooks/api/use-packages';
import { useClinicalNoteTemplates } from '@/hooks/api/use-clinical-note-templates';
import { useAuth, useLanguage } from '@/providers';
import { ROLE } from '@clinic/types';
import { EmptyState, ErrorState, FoldSection } from '@/components/primitives';

const KPI_GRID = 'grid grid-cols-2 gap-2.5 pt-2.5 lg:grid-cols-3 xl:grid-cols-6';

export function DashboardOverview() {
  const clinicId = useClinicId();
  const { t } = useLanguage();
  const { user } = useAuth();
  const practitionerId = user?.role === ROLE.PRACTITIONER ? user.clinicUserId : undefined;
  const kpis = useDashboardKpis(clinicId, practitionerId, !!user);
  const rooms = useRoomUtilization(clinicId, practitionerId, !!user);

  useDashboardRealtime(clinicId, { notifyOnAppointmentChange: true });
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(['overview', 'shortcuts']));
  const toggle = (key: string) => setOpen((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
  const can = (href: string) => canSeeNavHref(href, user?.role);
  const patients = usePatients({ clinicId }, { enabled: can(ROUTES.PATIENTS) });
  const practitioners = usePractitioners(can(ROUTES.PRACTITIONERS) ? clinicId : '');
  const departments = useDepartments(can(ROUTES.SETTINGS_DEPARTMENTS) ? clinicId : '');
  const services = useServices(can(ROUTES.SETTINGS_SERVICES) ? clinicId : '');
  const packages = usePackages(can(ROUTES.SETTINGS_PACKAGES) ? clinicId : '');
  const templates = useClinicalNoteTemplates(user?.role === ROLE.OWNER);
  const action = (href: string, label: string, kind: 'add' | 'view') => (can(href) ? { href, label, kind } : undefined);

  const overview = [
    { label: t.dashboard.todaysAppointments, value: kpis.data?.total ?? 0, icon: IconTodaysAppointments, action: action(ROUTES.SCHEDULE_NEW, t.appointments.addAppointment, 'add') },
    { label: t.dashboard.waiting, value: kpis.data?.waitingCount ?? 0, icon: IconTimer, action: action(schedulePath('queue'), t.common.view, 'view') },
    { label: t.dashboard.inProgress, value: kpis.data?.inProgress ?? 0, icon: IconTime, action: action(ROUTES.VISITS, t.common.view, 'view') },
    { label: t.dashboard.completed, value: kpis.data?.completed ?? 0, icon: IconCheckCircle, action: action(ROUTES.VISITS, t.common.view, 'view') },
    { label: t.dashboard.avgWait, value: formatWaitingMins(kpis.data?.avgWaitingMins, t), icon: IconHourglass, action: action(schedulePath('queue'), t.common.view, 'view') },
    { label: t.dashboard.rooms, value: kpis.data?.roomCount ?? 0, icon: IconRoom, action: action(createHref(ROUTES.SETTINGS_ROOMS), t.settings.addRoom, 'add') },
  ] satisfies ComponentProps<typeof KpiCardBlock>[];

  const shortcuts = ([
    { href: ROUTES.PATIENTS, label: t.layout.titles.patients, query: patients, icon: IconPatients, action: action(ROUTES.PATIENT_NEW, t.patient.addPatient, 'add') },
    { href: ROUTES.PRACTITIONERS, label: t.layout.titles.practitioners, query: practitioners, icon: IconPractitioner, action: action(ROUTES.PRACTITIONERS_NEW, t.practitioner.addPractitioner, 'add') },
    { href: ROUTES.SETTINGS_DEPARTMENTS, label: t.layout.titles.departments, query: departments, icon: IconDepartment, action: action(createHref(ROUTES.SETTINGS_DEPARTMENTS), t.settings.addDepartment, 'add') },
    { href: ROUTES.SETTINGS_SERVICES, label: t.layout.titles.services, query: services, icon: IconService, action: action(createHref(ROUTES.SETTINGS_SERVICES), t.settings.addService, 'add') },
    { href: ROUTES.SETTINGS_PACKAGES, label: t.layout.titles.packages, query: packages, icon: IconPackage, action: action(createHref(ROUTES.SETTINGS_PACKAGES), t.settings.addPackage, 'add') },
    { href: ROUTES.NOTE_TEMPLATES, label: t.layout.titles.noteTemplates, query: templates, icon: IconNoteCard, action: action(ROUTES.NOTE_TEMPLATE_NEW, t.visits.newTemplate, 'add') },
  ] as const).filter((card) => can(card.href) && (card.href !== ROUTES.NOTE_TEMPLATES || user?.role === ROLE.OWNER))
    .map(({ label, query, icon, action: cardAction }) => ({ label, value: query.data?.length, icon, action: cardAction, isLoading: query.isLoading }));

  const retry = () => {
    void kpis.refetch();
    void rooms.refetch();
  };

  return (
    <div className="page-fill gap-2.5">
      <div data-focus-hide="" className="shrink-0 space-y-2.5">
        <FoldSection label={t.dashboard.overview} open={open.has('overview')} onToggle={() => toggle('overview')}>
          <div className={KPI_GRID}>
            {overview.map((card) => <KpiCardBlock key={card.label} {...card} isLoading={kpis.isLoading} />)}
          </div>
        </FoldSection>
        {shortcuts.length ? (
          <FoldSection label={t.dashboard.quickActions} open={open.has('shortcuts')} onToggle={() => toggle('shortcuts')}>
            <div className={KPI_GRID}>
              {shortcuts.map((card) => <KpiCardBlock key={card.label} {...card} />)}
            </div>
          </FoldSection>
        ) : null}
      </div>

      {kpis.isError || rooms.isError ? (
        <ErrorState onRetry={retry} className="page-fill" />
      ) : !kpis.isLoading && !rooms.isLoading && kpis.data?.total === 0 && rooms.data?.length === 0 ? (
        <EmptyState icon={IconTodaysAppointments} title={t.appointments.noAppointments} description={t.appointments.noAppointmentsDesc} className="page-fill" />
      ) : (
        <ViewFocus label={t.dashboard.roomUtilizationToday} storageKey={`${clinicId || 'none'}:dashboard-room-utilization`}>
          {(focused) => <RoomUtilizationCardBlock rooms={rooms.data} isLoading={rooms.isLoading} focused={focused} />}
        </ViewFocus>
      )}
    </div>
  );
}
