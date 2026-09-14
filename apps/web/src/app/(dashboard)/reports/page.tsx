'use client';

import { useMemo, useState } from 'react';
import { BaseReportModal, ReportCard } from '@/components/blocks/reports';
import type { ReportModalFilters } from '@/components/blocks/reports';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { usePatients } from '@/hooks/api/use-patients';
import { usePractitioners } from '@/hooks/api/use-practitioners';
import { useAuth, useLanguage } from '@/providers';
import {
  useDownloadClinicAppointments,
  useDownloadFinanceReport,
  useDownloadPatientReport,
  useDownloadPatientsDirectory,
  useDownloadPractitionerAppointments,
  useDownloadPractitionerExceptions,
  useDownloadPractitionerHours,
  useDownloadPractitionerProfile,
  useDownloadPractitionersDirectory,
  useDownloadReferralsReport,
} from '@/hooks/api/use-reports';
import { useSessionStorageState } from '@/hooks/shared/use-session-storage-state';
import { currentMonthRange } from '@/constants/report';
import {
  IconPatients,
  IconPayment,
  IconPerson,
  IconPractitioner,
  IconReferral,
  IconCalendarClock,
  IconSchedule,
  IconTime,
  IconTodaysAppointments,
  type LucideIcon,
} from '@/constants/icons';
import type { ReportFormat } from '@/services/reports.service';
import type { IconWellAccent } from '@/components/primitives';

type ReportKey =
  | 'patientMedical'
  | 'patientsDirectory'
  | 'practitionersDirectory'
  | 'practitionerProfile'
  | 'practitionerAppointments'
  | 'practitionerHours'
  | 'practitionerExceptions'
  | 'clinicAppointments'
  | 'referrals'
  | 'finance';

type ReportDef = {
  key: ReportKey;
  icon: LucideIcon;
  accent: IconWellAccent;
  title: string;
  description: string;
  filters?: ReportModalFilters;
  finance?: boolean;
};

export default function ReportsPage() {
  const clinicId = useClinicId();
  const { user } = useAuth();
  const { t } = useLanguage();
  const canFinance =
    user?.role === 'owner' ||
    user?.role === 'admin' ||
    user?.role === 'financial';
  const month = useMemo(() => currentMonthRange(), []);

  const [activeKey, setActiveKey] = useState<ReportKey | null>(null);
  const [patientId, setPatientId] = useSessionStorageState('reports-patient', '');
  const [practitionerId, setPractitionerId] = useSessionStorageState(
    'reports-practitioner',
    '',
  );
  const [fromDate, setFromDate] = useSessionStorageState('reports-from', month.from);
  const [toDate, setToDate] = useSessionStorageState('reports-to', month.to);
  const [status, setStatus] = useSessionStorageState('reports-status', '');

  const { data: patients, isLoading: patientsLoading, isError: patientsError } = usePatients({
    clinicId,
    isActive: true,
    sortBy: 'firstNameEn',
    sortOrder: 'asc',
  });
  const {
    data: practitioners,
    isLoading: practitionersLoading,
    isError: practitionersError,
  } = usePractitioners(clinicId);

  const downloadPatient = useDownloadPatientReport(clinicId);
  const downloadPatientsDirectory = useDownloadPatientsDirectory(clinicId);
  const downloadPractitionersDirectory = useDownloadPractitionersDirectory(clinicId);
  const downloadPractitionerProfile = useDownloadPractitionerProfile(clinicId);
  const downloadPractitionerHours = useDownloadPractitionerHours(clinicId);
  const downloadPractitionerExceptions = useDownloadPractitionerExceptions(clinicId);
  const downloadPractitionerAppointments = useDownloadPractitionerAppointments(clinicId);
  const downloadClinicAppointments = useDownloadClinicAppointments(clinicId);
  const downloadReferrals = useDownloadReferralsReport(clinicId);
  const downloadFinance = useDownloadFinanceReport(clinicId);

  const catalog: { title: string; items: ReportDef[] }[] = [
    {
      title: t.reports.groupPatients,
      items: [
        {
          key: 'patientMedical',
          icon: IconPerson,
          accent: 'default',
          title: t.reports.patientMedical,
          description: t.reports.patientMedicalDesc,
          filters: { patient: 'required' },
        },
        {
          key: 'patientsDirectory',
          icon: IconPatients,
          accent: 'teal',
          title: t.reports.patientsDirectory,
          description: t.reports.patientsDirectoryDesc,
        },
      ],
    },
    {
      title: t.reports.groupPractitioners,
      items: [
        {
          key: 'practitionersDirectory',
          icon: IconPractitioner,
          accent: 'teal',
          title: t.reports.practitionersDirectory,
          description: t.reports.practitionersDirectoryDesc,
        },
        {
          key: 'practitionerProfile',
          icon: IconPerson,
          accent: 'default',
          title: t.reports.practitionerProfile,
          description: t.reports.practitionerProfileDesc,
          filters: { practitioner: 'required' },
        },
        {
          key: 'practitionerAppointments',
          icon: IconSchedule,
          accent: 'warning',
          title: t.reports.practitionerAppointments,
          description: t.reports.practitionerAppointmentsDesc,
          filters: { practitioner: 'required', dates: true },
        },
        {
          key: 'practitionerHours',
          icon: IconTime,
          accent: 'default',
          title: t.reports.practitionerHours,
          description: t.reports.practitionerHoursDesc,
          filters: { practitioner: 'required' },
        },
        {
          key: 'practitionerExceptions',
          icon: IconCalendarClock,
          accent: 'teal',
          title: t.reports.practitionerExceptions,
          description: t.reports.practitionerExceptionsDesc,
          filters: { practitioner: 'required' },
        },
      ],
    },
    {
      title: t.reports.groupOperations,
      items: [
        {
          key: 'clinicAppointments',
          icon: IconTodaysAppointments,
          accent: 'warning',
          title: t.reports.clinicAppointments,
          description: t.reports.clinicAppointmentsDesc,
          filters: { dates: true, status: true },
        },
        {
          key: 'referrals',
          icon: IconReferral,
          accent: 'warning',
          title: t.reports.referralsConsultations,
          description: t.reports.referralsConsultationsDesc,
          filters: { dates: true, patient: 'optional' },
        },
      ],
    },
    {
      title: t.reports.groupFinance,
      items: [
        {
          key: 'finance',
          icon: IconPayment,
          accent: 'success',
          title: t.reports.finance,
          description: t.reports.financeDesc,
          filters: { dates: true },
          finance: true,
        },
      ],
    },
  ];

  const active = catalog
    .flatMap((group) => group.items)
    .find((item) => item.key === activeKey);

  const needsPatients = Boolean(active?.filters?.patient);
  const needsPractitioners = Boolean(active?.filters?.practitioner);
  const isDirectory =
    activeKey === 'patientsDirectory' || activeKey === 'practitionersDirectory';

  const exportPending =
    downloadPatient.isPending ||
    downloadPatientsDirectory.isPending ||
    downloadPractitionersDirectory.isPending ||
    downloadPractitionerProfile.isPending ||
    downloadPractitionerHours.isPending ||
    downloadPractitionerExceptions.isPending ||
    downloadPractitionerAppointments.isPending ||
    downloadClinicAppointments.isPending ||
    downloadReferrals.isPending ||
    downloadFinance.isPending;

  const exportDisabled =
    (active?.filters?.patient === 'required' && !patientId) ||
    (active?.filters?.practitioner === 'required' && !practitionerId);

  const helperText =
    activeKey === 'patientsDirectory'
      ? `${patients?.length ?? 0} ${t.reports.activePatients} ${t.reports.readyToExport}`
      : activeKey === 'practitionersDirectory'
        ? `${practitioners?.length ?? 0} ${t.reports.readyPractitioners}`
        : undefined;

  const handleExport = (format: ReportFormat) => {
    switch (activeKey) {
      case 'patientMedical':
        downloadPatient.mutate({ patientId, format });
        break;
      case 'patientsDirectory':
        downloadPatientsDirectory.mutate({ format, status: 'active' });
        break;
      case 'practitionersDirectory':
        downloadPractitionersDirectory.mutate({ format });
        break;
      case 'practitionerProfile':
        downloadPractitionerProfile.mutate({ practitionerId, format });
        break;
      case 'practitionerHours':
        downloadPractitionerHours.mutate({ practitionerId, format });
        break;
      case 'practitionerExceptions':
        downloadPractitionerExceptions.mutate({ practitionerId, format });
        break;
      case 'practitionerAppointments':
        downloadPractitionerAppointments.mutate({
          practitionerId,
          format,
          from: fromDate || undefined,
          to: toDate || undefined,
        });
        break;
      case 'clinicAppointments':
        downloadClinicAppointments.mutate({
          format,
          from: fromDate || undefined,
          to: toDate || undefined,
          status: status || undefined,
        });
        break;
      case 'referrals':
        downloadReferrals.mutate({
          format,
          patientId: patientId || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
        });
        break;
      case 'finance':
        downloadFinance.mutate({
          format,
          from: fromDate || undefined,
          to: toDate || undefined,
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="w-full min-w-0 space-y-8">
      {catalog.map((group) => {
        const items = group.items.filter((item) => !item.finance || canFinance);
        if (!items.length) return null;
        return (
          <section key={group.title} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {group.title}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {items.map((item) => (
                <ReportCard
                  key={item.key}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  accent={item.accent}
                  onClick={() => setActiveKey(item.key)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {active ? (
        <BaseReportModal
          open
          onOpenChange={(open) => {
            if (!open) setActiveKey(null);
          }}
          title={active.title}
          description={active.description}
          isLoading={
            (needsPatients && patientsLoading) ||
            (needsPractitioners && practitionersLoading) ||
            (isDirectory && (patientsLoading || practitionersLoading))
          }
          isError={
            (needsPatients && patientsError) ||
            (needsPractitioners && practitionersError)
          }
          isEmpty={
            (needsPatients && patients?.length === 0) ||
            (needsPractitioners && practitioners?.length === 0) ||
            (activeKey === 'patientsDirectory' && patients?.length === 0) ||
            (activeKey === 'practitionersDirectory' &&
              practitioners?.length === 0)
          }
          emptyIcon={active.icon}
          emptyTitle={
            needsPatients || activeKey === 'patientsDirectory'
              ? t.patient.noPatients
              : t.practitioner.noPractitioners
          }
          filters={active.filters}
          patients={patients}
          practitioners={practitioners}
          patientId={patientId}
          onPatientChange={setPatientId}
          practitionerId={practitionerId}
          onPractitionerChange={setPractitionerId}
          fromDate={fromDate}
          toDate={toDate}
          onFromChange={setFromDate}
          onToChange={setToDate}
          status={status}
          onStatusChange={setStatus}
          helperText={helperText}
          exportDisabled={exportDisabled}
          isExporting={exportPending}
          onExport={handleExport}
        />
      ) : null}
    </div>
  );
}
