'use client';

import { useMemo, useState } from 'react';
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns';
import {
  FileDown,
  GitBranch,
  Loader2,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DatePicker } from '@/components/primitives/date-picker';
import { PatientCombobox } from '@/components/blocks/appointments/patient-combobox';
import { useClinicId } from '@/hooks/use-clinic-id';
import { usePatients } from '@/hooks/use-patients';
import { useAuth } from '@/providers';
import {
  useDownloadFinanceReport,
  useDownloadPatientReport,
  useDownloadReferralsReport,
} from '@/hooks/use-reports';
import type { ReportFormat } from '@/services/reports.service';
import { exportPatients, type PatientExportFormat } from '@/lib/export-patients';
import { toast } from 'sonner';

function currentMonthRange() {
  const now = new Date();
  return {
    from: format(startOfMonth(now), 'yyyy-MM-dd'),
    to: format(endOfMonth(now), 'yyyy-MM-dd'),
  };
}

function FormatDownloadButton({
  pending,
  disabled,
  onDownload,
  label = 'Download',
  className,
}: {
  pending: boolean;
  disabled?: boolean;
  onDownload: (format: ReportFormat) => void;
  label?: string;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className={className} disabled={disabled || pending}>
          {pending ? (
            <Loader2 className="size-4 mr-1.5 animate-spin" />
          ) : (
            <FileDown className="size-4 mr-1.5" />
          )}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onDownload('pdf')}>PDF</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload('docx')}>Word</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload('xlsx')}>Excel</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload('csv')}>CSV</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DatePresets({
  onPick,
}: {
  onPick: (from: string, to: string) => void;
}) {
  const presets = [
    {
      label: 'This month',
      run: () => {
        const now = new Date();
        onPick(format(startOfMonth(now), 'yyyy-MM-dd'), format(endOfMonth(now), 'yyyy-MM-dd'));
      },
    },
    {
      label: 'Last month',
      run: () => {
        const d = subMonths(new Date(), 1);
        onPick(format(startOfMonth(d), 'yyyy-MM-dd'), format(endOfMonth(d), 'yyyy-MM-dd'));
      },
    },
    {
      label: 'This year',
      run: () => {
        const now = new Date();
        onPick(format(startOfYear(now), 'yyyy-MM-dd'), format(endOfYear(now), 'yyyy-MM-dd'));
      },
    },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((p) => (
        <Button
          key={p.label}
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2.5 text-xs"
          onClick={p.run}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}

function ReportBlock({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted">
          <Icon className="size-4 text-foreground" />
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-sm font-semibold leading-none">{title}</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3">{children}</div>
    </section>
  );
}

export default function ReportsPage() {
  const clinicId = useClinicId();
  const { user } = useAuth();
  const canFinance =
    user?.role === 'owner' || user?.role === 'admin' || user?.role === 'financial';
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
        <ReportBlock
          icon={UserRound}
          title="Patient medical"
          description="Visit history and profile for one patient."
        >
          <div className="space-y-1.5">
            <Label className="text-xs">Patient</Label>
            <PatientCombobox
              patients={patients}
              value={patientReportId}
              onChange={setPatientReportId}
              placeholder="Select patient"
            />
          </div>
          <div className="mt-auto pt-1">
            <FormatDownloadButton
              className="w-full sm:w-auto"
              pending={downloadPatient.isPending}
              disabled={!patientReportId}
              onDownload={(format) =>
                downloadPatient.mutate({ patientId: patientReportId, format })
              }
            />
          </div>
        </ReportBlock>

        <ReportBlock
          icon={Users}
          title="Patients directory"
          description="Export the active patients roster (A–Z)."
        >
          <p className="text-xs text-muted-foreground">
            {patientsLoading
              ? 'Loading…'
              : `${patients?.length ?? 0} active patient${(patients?.length ?? 0) === 1 ? '' : 's'}`}
          </p>
          <div className="mt-auto pt-1">
            <FormatDownloadButton
              className="w-full sm:w-auto"
              pending={false}
              disabled={patientsLoading || !patients?.length}
              label="Export"
              onDownload={(fmt) => {
                if (!patients?.length) return;
                const formatMap: Record<ReportFormat, PatientExportFormat> = {
                  pdf: 'pdf',
                  xlsx: 'xlsx',
                  csv: 'csv',
                  docx: 'docx',
                };
                exportPatients(
                  patients,
                  formatMap[fmt],
                  `patients-directory-${format(new Date(), 'yyyy-MM-dd')}`,
                );
                toast.success(
                  fmt === 'pdf'
                    ? 'Print dialog opened — choose Save as PDF'
                    : `Exported ${patients.length} patients`,
                );
              }}
            />
          </div>
        </ReportBlock>

        <ReportBlock
          icon={GitBranch}
          title="Referrals & consultations"
          description="Referrals in a date range. Optionally filter by patient."
        >
          <DatePresets
            onPick={(from, to) => {
              setReferralsFrom(from);
              setReferralsTo(to);
            }}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">From</Label>
              <DatePicker
                value={referralsFrom}
                onChange={setReferralsFrom}
                placeholder="From"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To</Label>
              <DatePicker value={referralsTo} onChange={setReferralsTo} placeholder="To" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Patient (optional)</Label>
            <PatientCombobox
              patients={patients}
              value={referralsPatientId}
              onChange={setReferralsPatientId}
              placeholder="All patients"
              allowClear
            />
          </div>
          <div className="mt-auto pt-1">
            <FormatDownloadButton
              className="w-full sm:w-auto"
              pending={downloadReferrals.isPending}
              onDownload={(format) =>
                downloadReferrals.mutate({
                  format,
                  patientId: referralsPatientId || undefined,
                  from: referralsFrom || undefined,
                  to: referralsTo || undefined,
                })
              }
            />
          </div>
        </ReportBlock>

        {canFinance && (
          <ReportBlock
            icon={Wallet}
            title="Finance"
            description="Revenue, unpaid balances, by payment method and doctor."
          >
            <DatePresets
              onPick={(from, to) => {
                setFinanceFrom(from);
                setFinanceTo(to);
              }}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">From</Label>
                <DatePicker
                  value={financeFrom}
                  onChange={setFinanceFrom}
                  placeholder="From"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">To</Label>
                <DatePicker value={financeTo} onChange={setFinanceTo} placeholder="To" />
              </div>
            </div>
            <div className="mt-auto pt-1">
              <FormatDownloadButton
                className="w-full sm:w-auto"
                pending={downloadFinance.isPending}
                onDownload={(format) =>
                  downloadFinance.mutate({
                    format,
                    from: financeFrom || undefined,
                    to: financeTo || undefined,
                  })
                }
              />
            </div>
          </ReportBlock>
        )}
      </div>
    </div>
  );
}
