'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  DatePicker,
  FormField,
} from '@/components/primitives';
import { PatientCombobox } from '@/components/blocks/appointments';
import {
  DateRangePresets,
  ExportFormatButton,
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
  const { t, lang } = useLanguage();
  const canFinance =
    user?.role === 'owner' ||
    user?.role === 'admin' ||
    user?.role === 'financial';
  const month = useMemo(() => currentMonthRange(), []);

  const [patientReportId, setPatientReportId] = useSessionStorageState('reports-patient', '');
  const [referralsPatientId, setReferralsPatientId] = useSessionStorageState('reports-ref-patient', '');
  const [referralsFrom, setReferralsFrom] = useSessionStorageState('reports-ref-from', month.from);
  const [referralsTo, setReferralsTo] = useSessionStorageState('reports-ref-to', month.to);
  const [financeFrom, setFinanceFrom] = useSessionStorageState('reports-fin-from', month.from);
  const [financeTo, setFinanceTo] = useSessionStorageState('reports-fin-to', month.to);

  const { data: patients, isLoading: patientsLoading } = usePatients({
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
          title={t?.reports?.patientMedical ?? "Patient medical"}
          description={t?.reports?.patientMedicalDesc ?? "Visit history and profile for one patient."}
        >
          <FormField label={t?.patient?.patient ?? "Patient"} labelClassName="text-xs">
            <PatientCombobox
              patients={patients}
              value={patientReportId}
              onChange={setPatientReportId}
              placeholder={t?.reports?.selectPatient ?? "Select patient"}
            />
          </FormField>
          <div className="mt-auto pt-1">
            <ExportFormatButton
              className="w-full sm:w-auto"
              pending={downloadPatient.isPending}
              disabled={!patientReportId}
              onSelect={(format) =>
                downloadPatient.mutate({ patientId: patientReportId, format })
              }
            />
          </div>
        </ReportCard>

        <ReportCard
          icon={IconPatients}
          title={t?.reports?.patientsDirectory ?? "Patients directory"}
          description={t?.reports?.patientsDirectoryDesc ?? "Export the active patients roster (A–Z)."}
        >
          <p className="text-xs text-muted-foreground">
            {patientsLoading
              ? (t?.common?.loading ?? 'Loading…')
              : `${patients?.length ?? 0} ${t?.reports?.activePatients ?? 'active patients'}`}
          </p>
          <div className="mt-auto pt-1">
            <ExportFormatButton
              className="w-full sm:w-auto"
              disabled={patientsLoading || !patients?.length}
              onSelect={(fmt) => {
                if (!patients?.length) return;
                exportPatients(
                  patients,
                  fmt,
                  `patients-directory-${format(new Date(), 'yyyy-MM-dd')}`,
                );
                toast.success(
                  fmt === 'pdf'
                    ? 'Print dialog opened - choose Save as PDF'
                    : `Downloaded ${patients.length} patients`,
                );
              }}
            />
          </div>
        </ReportCard>

        <ReportCard
          icon={IconReferral}
          title={t?.reports?.referralsConsultations ?? "Referrals & consultations"}
          description={t?.reports?.referralsConsultationsDesc ?? "Referrals in a date range. Optionally filter by patient."}
        >
          <DateRangePresets
            onPick={(from, to) => {
              setReferralsFrom(from);
              setReferralsTo(to);
            }}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label={t?.reports?.from ?? "From"} labelClassName="text-xs">
              <DatePicker
                value={referralsFrom}
                onChange={setReferralsFrom}
                placeholder={t?.reports?.from ?? "From"}
              />
            </FormField>
            <FormField label={t?.reports?.to ?? "To"} labelClassName="text-xs">
              <DatePicker
                value={referralsTo}
                onChange={setReferralsTo}
                placeholder={t?.reports?.to ?? "To"}
              />
            </FormField>
          </div>
          <FormField label={`${t?.patient?.patient ?? "Patient"} (${t?.common?.optional ?? (lang === 'ar' ? 'اختياري' : 'optional')})`} labelClassName="text-xs">
            <PatientCombobox
              patients={patients}
              value={referralsPatientId}
              onChange={setReferralsPatientId}
              placeholder={t?.reports?.allPatients ?? "All patients"}
              allowClear
            />
          </FormField>
          <div className="mt-auto pt-1">
            <ExportFormatButton
              className="w-full sm:w-auto"
              pending={downloadReferrals.isPending}
              onSelect={(format) =>
                downloadReferrals.mutate({
                  format,
                  patientId: referralsPatientId || undefined,
                  from: referralsFrom || undefined,
                  to: referralsTo || undefined,
                })
              }
            />
          </div>
        </ReportCard>

        {canFinance && (
          <ReportCard
            icon={IconPayment}
            title={t?.reports?.finance ?? "Finance"}
            description={t?.reports?.financeDesc ?? "Revenue, unpaid balances, by payment method and doctor."}
          >
            <DateRangePresets
              onPick={(from, to) => {
                setFinanceFrom(from);
                setFinanceTo(to);
              }}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label={t?.reports?.from ?? "From"} labelClassName="text-xs">
                <DatePicker
                  value={financeFrom}
                  onChange={setFinanceFrom}
                  placeholder={t?.reports?.from ?? "From"}
                />
              </FormField>
              <FormField label={t?.reports?.to ?? "To"} labelClassName="text-xs">
                <DatePicker
                  value={financeTo}
                  onChange={setFinanceTo}
                  placeholder={t?.reports?.to ?? "To"}
                />
              </FormField>
            </div>
            <div className="mt-auto pt-1">
              <ExportFormatButton
                className="w-full sm:w-auto"
                pending={downloadFinance.isPending}
                onSelect={(format) =>
                  downloadFinance.mutate({
                    format,
                    from: financeFrom || undefined,
                    to: financeTo || undefined,
                  })
                }
              />
            </div>
          </ReportCard>
        )}
      </div>
    </div>
  );
}
