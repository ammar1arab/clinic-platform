'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  useDownloadVisitsReport,
} from '@/hooks/api/use-reports';
import { useSessionStorageState } from '@/hooks/shared/use-session-storage-state';
import { currentMonthRange } from '@/constants/report';
import {
  IconPatients,
  IconPayment,
  IconPerson,
  IconPractitioner,
  IconReferral,
  IconFileText,
  IconCalendarClock,
  IconSchedule,
  IconTime,
  IconTodaysAppointments,
  type LucideIcon,
} from '@/constants/icons';
import type { ReportFormat } from '@/services/reports.service';
import { reportViewHref, type ReportViewRequest } from '@/lib/report-view';

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
  | 'finance'
  | 'signedVisits'
  | 'issuedInvoices';

type ReportDef = {
  key: ReportKey;
  icon: LucideIcon;
  title: string;
  description: string;
  filters?: ReportModalFilters;
  finance?: boolean;
};

export default function ReportsPage() {
  const clinicId = useClinicId();
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const canFinance =
    user?.role === 'owner' ||
    user?.role === 'admin' ||
    user?.role === 'financial';
  const isPractitioner = user?.role === 'practitioner';
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
  const scopedPractitionerId = isPractitioner
    ? user?.clinicUserId ?? ''
    : practitionerId;

  const needsPatients =
    activeKey === 'patientMedical' ||
    activeKey === 'referrals' ||
    activeKey === 'patientsDirectory';
  const needsPractitioners =
    !isPractitioner &&
    (activeKey === 'practitionerProfile' ||
      activeKey === 'practitionerAppointments' ||
      activeKey === 'practitionerHours' ||
      activeKey === 'practitionerExceptions' ||
      activeKey === 'practitionersDirectory');

  const { data: patients, isLoading: patientsLoading, isError: patientsError } = usePatients(
    {
      clinicId,
      isActive: true,
      sortBy: 'firstNameEn',
      sortOrder: 'asc',
    },
    { enabled: needsPatients },
  );
  const {
    data: practitioners,
    isLoading: practitionersLoading,
    isError: practitionersError,
  } = usePractitioners(clinicId, needsPractitioners);

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
  const downloadVisits = useDownloadVisitsReport(clinicId);

  const signedVisitsDef: ReportDef = {
    key: 'signedVisits',
    icon: IconFileText,
    title: t.visits.signedReports,
    description: t.visits.signedReportsDesc,
    filters: { dates: true },
  };

  const issuedInvoicesDef: ReportDef = {
    key: 'issuedInvoices',
    icon: IconPayment,
    title: t.visits.issuedInvoices,
    description: t.visits.issuedInvoicesDesc,
    filters: { dates: true },
  };

  const ownerCatalog: { title: string; items: ReportDef[] }[] = [
    {
      title: t.reports.groupPatients,
      items: [
        {
          key: 'patientMedical',
          icon: IconPerson,
          title: t.reports.patientMedical,
          description: t.reports.patientMedicalDesc,
          filters: { patient: 'required' },
        },
        {
          key: 'patientsDirectory',
          icon: IconPatients,
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
          title: t.reports.practitionersDirectory,
          description: t.reports.practitionersDirectoryDesc,
        },
        {
          key: 'practitionerProfile',
          icon: IconPerson,
          title: t.reports.practitionerProfile,
          description: t.reports.practitionerProfileDesc,
          filters: { practitioner: 'required', dates: true },
        },
        {
          key: 'practitionerAppointments',
          icon: IconSchedule,
          title: t.reports.practitionerAppointments,
          description: t.reports.practitionerAppointmentsDesc,
          filters: { practitioner: 'required', dates: true },
        },
        {
          key: 'practitionerHours',
          icon: IconTime,
          title: t.reports.practitionerHours,
          description: t.reports.practitionerHoursDesc,
          filters: { practitioner: 'required', dates: true },
        },
        {
          key: 'practitionerExceptions',
          icon: IconCalendarClock,
          title: t.reports.practitionerExceptions,
          description: t.reports.practitionerExceptionsDesc,
          filters: { practitioner: 'required', dates: true },
        },
      ],
    },
    {
      title: t.reports.groupOperations,
      items: [
        {
          key: 'clinicAppointments',
          icon: IconTodaysAppointments,
          title: t.reports.clinicAppointments,
          description: t.reports.clinicAppointmentsDesc,
          filters: { dates: true, status: true },
        },
        {
          key: 'referrals',
          icon: IconReferral,
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
          title: t.reports.finance,
          description: t.reports.financeDesc,
          filters: { dates: true },
          finance: true,
        },
      ],
    },
  ];

  const catalog: { title: string; items: ReportDef[] }[] = isPractitioner
    ? [
        {
          title: t.reports.myReports,
          items: [
            {
              key: 'practitionerAppointments',
              icon: IconSchedule,
              title: t.reports.myAppointments,
              description: t.reports.myAppointmentsDesc,
              filters: { dates: true },
            },
            {
              key: 'practitionerHours',
              icon: IconTime,
              title: t.reports.practitionerHours,
              description: t.reports.practitionerHoursDesc,
              filters: { dates: true },
            },
            {
              key: 'practitionerExceptions',
              icon: IconCalendarClock,
              title: t.reports.practitionerExceptions,
              description: t.reports.practitionerExceptionsDesc,
              filters: { dates: true },
            },
          ],
        },
      ]
    : ownerCatalog;

  const active =
    activeKey === 'signedVisits'
      ? signedVisitsDef
      : activeKey === 'issuedInvoices'
        ? issuedInvoicesDef
        : catalog.flatMap((group) => group.items).find((item) => item.key === activeKey);

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
    downloadFinance.isPending ||
    downloadVisits.isPending;

  const exportDisabled =
    (active?.filters?.patient === 'required' && !patientId) ||
    (active?.filters?.practitioner === 'required' && !scopedPractitionerId);

  const helperText =
    activeKey === 'patientsDirectory'
      ? `${patients?.length ?? 0} ${t.reports.activePatients} ${t.reports.readyToExport}`
      : activeKey === 'practitionersDirectory'
        ? `${practitioners?.length ?? 0} ${t.reports.readyPractitioners}`
        : undefined;

  const handleView = () => {
    if (!activeKey) return;
    const request: ReportViewRequest = {
      key: activeKey,
      patientId: patientId || undefined,
      practitionerId: scopedPractitionerId || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      status: status || undefined,
    };
    setActiveKey(null);
    router.push(reportViewHref(request));
  };

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
        downloadPractitionerProfile.mutate({ practitionerId: scopedPractitionerId, format });
        break;
      case 'practitionerHours':
        downloadPractitionerHours.mutate({ practitionerId: scopedPractitionerId, format, from: fromDate || undefined, to: toDate || undefined });
        break;
      case 'practitionerExceptions':
        downloadPractitionerExceptions.mutate({ practitionerId: scopedPractitionerId, format, from: fromDate || undefined, to: toDate || undefined });
        break;
      case 'practitionerAppointments':
        downloadPractitionerAppointments.mutate({
          practitionerId: scopedPractitionerId,
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
      case 'signedVisits':
        downloadVisits.mutate({
          format,
          from: fromDate || undefined,
          to: toDate || undefined,
          reportStatus: 'signed',
        });
        break;
      case 'issuedInvoices':
        downloadVisits.mutate({
          format,
          from: fromDate || undefined,
          to: toDate || undefined,
          invoiceStatus: 'issued',
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
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">{t.visits.title}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ReportCard icon={IconFileText} title={t.visits.signedReports} description={t.visits.signedReportsDesc} onClick={() => setActiveKey('signedVisits')} />
          {canFinance ? <ReportCard icon={IconPayment} title={t.visits.issuedInvoices} description={t.visits.issuedInvoicesDesc} onClick={() => setActiveKey('issuedInvoices')} /> : null}
        </div>
      </section>
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
            (needsPractitioners && practitioners?.length === 0)
          }
          emptyIcon={active.icon}
          emptyTitle={
            needsPatients ? t.patient.noPatients : t.practitioner.noPractitioners
          }
          filters={active.filters}
          patients={patients}
          practitioners={practitioners}
          patientId={patientId}
          onPatientChange={setPatientId}
          practitionerId={scopedPractitionerId}
          onPractitionerChange={isPractitioner ? undefined : setPractitionerId}
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
          onView={handleView}
        />
      ) : null}
    </div>
  );
}
