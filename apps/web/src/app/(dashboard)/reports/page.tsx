'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  PatientReportModal,
  DirectoryReportModal,
  ReferralsReportModal,
  FinanceReportModal,
  ReportCard,
} from '@/components/blocks/reports';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { usePatients } from '@/hooks/api/use-patients';
import { useAuth, useLanguage } from '@/providers';
import {
  useDownloadFinanceReport,
  useDownloadPatientReport,
  useDownloadReferralsReport,
} from '@/hooks/api/use-reports';
import { useSessionStorageState } from '@/hooks/shared/use-session-storage-state';
import { currentMonthRange } from '@/constants/report';
import { IconPatients, IconPayment, IconPerson, IconReferral } from '@/constants/icons';
import { exportPatients } from '@/lib/export-patients';
import { toast } from 'sonner';

export default function ReportsPage() {
  const clinicId = useClinicId();
  const { user } = useAuth();
  const { t } = useLanguage();
  const canFinance =
    user?.role === 'owner' ||
    user?.role === 'admin' ||
    user?.role === 'financial';
  const month = useMemo(() => currentMonthRange(), []);

  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [directoryModalOpen, setDirectoryModalOpen] = useState(false);
  const [referralsModalOpen, setReferralsModalOpen] = useState(false);
  const [financeModalOpen, setFinanceModalOpen] = useState(false);

  const [patientReportId, setPatientReportId] = useSessionStorageState('reports-patient', '');
  const [referralsPatientId, setReferralsPatientId] = useSessionStorageState('reports-ref-patient', '');
  const [referralsFrom, setReferralsFrom] = useSessionStorageState('reports-ref-from', month.from);
  const [referralsTo, setReferralsTo] = useSessionStorageState('reports-ref-to', month.to);
  const [financeFrom, setFinanceFrom] = useSessionStorageState('reports-fin-from', month.from);
  const [financeTo, setFinanceTo] = useSessionStorageState('reports-fin-to', month.to);

  const { data: patients, isLoading: patientsLoading, isError: patientsError } = usePatients({
    clinicId,
    isActive: true,
    sortBy: 'firstNameEn',
    sortOrder: 'asc',
  });
  const downloadPatient = useDownloadPatientReport(clinicId);
  const downloadReferrals = useDownloadReferralsReport(clinicId);
  const downloadFinance = useDownloadFinanceReport(clinicId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ReportCard
          icon={IconPerson}
          title={t?.reports?.patientMedical}
          description={t?.reports?.patientMedicalDesc}
          accent="default"
          onClick={() => setPatientModalOpen(true)}
        />

        <ReportCard
          icon={IconPatients}
          title={t?.reports?.patientsDirectory}
          description={t?.reports?.patientsDirectoryDesc}
          accent="teal"
          onClick={() => setDirectoryModalOpen(true)}
        />

        <ReportCard
          icon={IconReferral}
          title={t?.reports?.referralsConsultations}
          description={t?.reports?.referralsConsultationsDesc}
          accent="warning"
          onClick={() => setReferralsModalOpen(true)}
        />

        {canFinance && (
          <ReportCard
            icon={IconPayment}
            title={t?.reports?.finance}
            description={t?.reports?.financeDesc}
            accent="success"
            onClick={() => setFinanceModalOpen(true)}
          />
        )}
      </div>

      <PatientReportModal
        open={patientModalOpen}
        onOpenChange={setPatientModalOpen}
        patients={patients}
        isLoading={patientsLoading}
        isError={patientsError}
        patientId={patientReportId}
        onPatientChange={setPatientReportId}
        isExporting={downloadPatient.isPending}
        onExport={(format) => downloadPatient.mutate({ patientId: patientReportId, format })}
      />

      <DirectoryReportModal
        open={directoryModalOpen}
        onOpenChange={setDirectoryModalOpen}
        patients={patients}
        isLoading={patientsLoading}
        isError={patientsError}
        onExport={(fmt) => {
          if (!patients?.length) return;
          exportPatients(
            patients,
            fmt,
            `patients-directory-${format(new Date(), 'yyyy-MM-dd')}`,
          );
          toast.success(
            fmt === 'pdf'
              ? t.reports.pdfPrintOpened
              : t.reports.downloadedPatients.replace('{count}', patients.length.toString()),
          );
        }}
      />

      <ReferralsReportModal
        open={referralsModalOpen}
        onOpenChange={setReferralsModalOpen}
        patients={patients}
        isLoading={patientsLoading}
        isError={patientsError}
        patientId={referralsPatientId}
        onPatientChange={setReferralsPatientId}
        fromDate={referralsFrom}
        onFromChange={setReferralsFrom}
        toDate={referralsTo}
        onToChange={setReferralsTo}
        isExporting={downloadReferrals.isPending}
        onExport={(fmt) =>
          downloadReferrals.mutate({
            format: fmt,
            patientId: referralsPatientId || undefined,
            from: referralsFrom || undefined,
            to: referralsTo || undefined,
          })
        }
      />

      {canFinance && (
        <FinanceReportModal
          open={financeModalOpen}
          onOpenChange={setFinanceModalOpen}
          fromDate={financeFrom}
          onFromChange={setFinanceFrom}
          toDate={financeTo}
          onToChange={setFinanceTo}
          isExporting={downloadFinance.isPending}
          onExport={(fmt) =>
            downloadFinance.mutate({
              format: fmt,
              from: financeFrom || undefined,
              to: financeTo || undefined,
            })
          }
        />
      )}
    </div>
  );
}
