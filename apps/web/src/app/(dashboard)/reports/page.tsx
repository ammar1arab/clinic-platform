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
import { useAuth } from '@/providers';
import {
  useDownloadFinanceReport,
  useDownloadPatientReport,
  useDownloadReferralsReport,
} from '@/hooks/api/use-reports';
import { currentMonthRange } from '@/constants/report';
import { IconPatients, IconPayment, IconPerson, IconReferral } from '@/constants/icons';
import { exportPatients } from '@/lib/export-patients';
import { toast } from 'sonner';

export default function ReportsPage() {
  const clinicId = useClinicId();
  const { user } = useAuth();
  const canFinance =
    user?.role === 'owner' ||
    user?.role === 'admin' ||
    user?.role === 'financial';
  const month = useMemo(() => currentMonthRange(), []);

  const [patientReportId, setPatientReportId] = useState('');
  const [referralsPatientId, setReferralsPatientId] = useState('');
  const [referralsFrom, setReferralsFrom] = useState(month.from);
  const [referralsTo, setReferralsTo] = useState(month.to);
  const [financeFrom, setFinanceFrom] = useState(month.from);
  const [financeTo, setFinanceTo] = useState(month.to);

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
          title="Patient medical"
          description="Visit history and profile for one patient."
        >
          <FormField label="Patient" labelClassName="text-xs">
            <PatientCombobox
              patients={patients}
              value={patientReportId}
              onChange={setPatientReportId}
              placeholder="Select patient"
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
          title="Patients directory"
          description="Export the active patients roster (A–Z)."
        >
          <p className="text-xs text-muted-foreground">
            {patientsLoading
              ? 'Loading…'
              : `${patients?.length ?? 0} active patient${(patients?.length ?? 0) === 1 ? '' : 's'}`}
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
          title="Referrals & consultations"
          description="Referrals in a date range. Optionally filter by patient."
        >
          <DateRangePresets
            onPick={(from, to) => {
              setReferralsFrom(from);
              setReferralsTo(to);
            }}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="From" labelClassName="text-xs">
              <DatePicker
                value={referralsFrom}
                onChange={setReferralsFrom}
                placeholder="From"
              />
            </FormField>
            <FormField label="To" labelClassName="text-xs">
              <DatePicker
                value={referralsTo}
                onChange={setReferralsTo}
                placeholder="To"
              />
            </FormField>
          </div>
          <FormField label="Patient (optional)" labelClassName="text-xs">
            <PatientCombobox
              patients={patients}
              value={referralsPatientId}
              onChange={setReferralsPatientId}
              placeholder="All patients"
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
            title="Finance"
            description="Revenue, unpaid balances, by payment method and doctor."
          >
            <DateRangePresets
              onPick={(from, to) => {
                setFinanceFrom(from);
                setFinanceTo(to);
              }}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="From" labelClassName="text-xs">
                <DatePicker
                  value={financeFrom}
                  onChange={setFinanceFrom}
                  placeholder="From"
                />
              </FormField>
              <FormField label="To" labelClassName="text-xs">
                <DatePicker
                  value={financeTo}
                  onChange={setFinanceTo}
                  placeholder="To"
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
