'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { FormField, DatePicker, FormSkeleton, EmptyState, ErrorState } from '@/components/primitives';
import { PatientCombobox } from '@/components/blocks/appointments';
import { DateRangePresets, ExportFormatButton } from '@/components/blocks/reports';
import type { Patient } from '@/services/patients.service';
import type { ReportFormat } from '@/services/reports.service';
import { useLanguage } from '@/providers';
import { IconPerson, IconPatients, type LucideIcon } from '@/constants/icons';

type BaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  children: React.ReactNode;
};

export function BaseReportModal({
  open,
  onOpenChange,
  title,
  description,
  isLoading,
  isError,
  isEmpty,
  emptyIcon,
  emptyTitle,
  children,
}: BaseProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent preventClose>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <FormSkeleton fields={1} className="py-4" />
        ) : isError ? (
          <ErrorState title={t?.common?.somethingWentWrong} />
        ) : isEmpty && emptyIcon && emptyTitle ? (
          <EmptyState icon={emptyIcon} title={emptyTitle} />
        ) : (
          <div className="flex flex-col gap-6 py-2">{children}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PatientReportModal({
  open,
  onOpenChange,
  patients,
  isLoading,
  isError,
  patientId,
  onPatientChange,
  onExport,
  isExporting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[] | undefined;
  isLoading: boolean;
  isError?: boolean;
  patientId: string;
  onPatientChange: (id: string) => void;
  onExport: (format: ReportFormat) => void;
  isExporting: boolean;
}) {
  const { t } = useLanguage();

  return (
    <BaseReportModal
      open={open}
      onOpenChange={onOpenChange}
      title={t?.reports?.patientMedical}
      description={t?.reports?.patientMedicalDesc}
      isLoading={isLoading}
      isError={isError}
      isEmpty={patients?.length === 0}
      emptyIcon={IconPerson}
      emptyTitle={t?.patient?.noPatients}
    >
      <FormField label={t?.patient?.patient} labelClassName="text-xs">
        <PatientCombobox
          patients={patients}
          value={patientId}
          onChange={onPatientChange}
          placeholder={t?.reports?.selectPatient}
        />
      </FormField>
      <div className="flex justify-end">
        <ExportFormatButton
          className="w-full sm:w-auto"
          pending={isExporting}
          disabled={!patientId}
          onSelect={onExport}
        />
      </div>
    </BaseReportModal>
  );
}

export function DirectoryReportModal({
  open,
  onOpenChange,
  patients,
  isLoading,
  isError,
  onExport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[] | undefined;
  isLoading: boolean;
  isError?: boolean;
  onExport: (format: ReportFormat) => void;
}) {
  const { t } = useLanguage();

  return (
    <BaseReportModal
      open={open}
      onOpenChange={onOpenChange}
      title={t?.reports?.patientsDirectory}
      description={t?.reports?.patientsDirectoryDesc}
      isLoading={isLoading}
      isError={isError}
      isEmpty={patients?.length === 0}
      emptyIcon={IconPatients}
      emptyTitle={t?.patient?.noPatients}
    >
      <p className="text-sm text-muted-foreground">
        {patients?.length ?? 0} {t?.reports?.activePatients} {t?.reports?.readyToExport}
      </p>
      <div className="flex justify-end">
        <ExportFormatButton className="w-full sm:w-auto" onSelect={onExport} />
      </div>
    </BaseReportModal>
  );
}

export function ReferralsReportModal({
  open,
  onOpenChange,
  patients,
  isLoading,
  isError,
  patientId,
  onPatientChange,
  fromDate,
  onFromChange,
  toDate,
  onToChange,
  onExport,
  isExporting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[] | undefined;
  isLoading: boolean;
  isError?: boolean;
  patientId: string;
  onPatientChange: (id: string) => void;
  fromDate: string;
  onFromChange: (val: string) => void;
  toDate: string;
  onToChange: (val: string) => void;
  onExport: (format: ReportFormat) => void;
  isExporting: boolean;
}) {
  const { t, lang } = useLanguage();

  return (
    <BaseReportModal
      open={open}
      onOpenChange={onOpenChange}
      title={t?.reports?.referralsConsultations}
      description={t?.reports?.referralsConsultationsDesc}
      isLoading={isLoading}
      isError={isError}
    >
      <DateRangePresets
        onPick={(from: string, to: string) => {
          onFromChange(from);
          onToChange(to);
        }}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label={t?.reports?.from} labelClassName="text-xs">
          <DatePicker value={fromDate} onChange={onFromChange} placeholder={t?.reports?.from} />
        </FormField>
        <FormField label={t?.reports?.to} labelClassName="text-xs">
          <DatePicker value={toDate} onChange={onToChange} placeholder={t?.reports?.to} />
        </FormField>
      </div>

      <FormField
        label={`${t?.patient?.patient} (${t?.common?.optional})`}
        labelClassName="text-xs"
      >
        <PatientCombobox
          patients={patients}
          value={patientId}
          onChange={onPatientChange}
          placeholder={t?.reports?.allPatients}
          allowClear
        />
      </FormField>

      <div className="flex justify-end pt-2">
        <ExportFormatButton className="w-full sm:w-auto" pending={isExporting} onSelect={onExport} />
      </div>
    </BaseReportModal>
  );
}

export function FinanceReportModal({
  open,
  onOpenChange,
  fromDate,
  onFromChange,
  toDate,
  onToChange,
  onExport,
  isExporting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromDate: string;
  onFromChange: (val: string) => void;
  toDate: string;
  onToChange: (val: string) => void;
  onExport: (format: ReportFormat) => void;
  isExporting: boolean;
}) {
  const { t } = useLanguage();

  return (
    <BaseReportModal
      open={open}
      onOpenChange={onOpenChange}
      title={t?.reports?.finance}
      description={t?.reports?.financeDesc}
    >
      <DateRangePresets
        onPick={(from: string, to: string) => {
          onFromChange(from);
          onToChange(to);
        }}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label={t?.reports?.from} labelClassName="text-xs">
          <DatePicker value={fromDate} onChange={onFromChange} placeholder={t?.reports?.from} />
        </FormField>
        <FormField label={t?.reports?.to} labelClassName="text-xs">
          <DatePicker value={toDate} onChange={onToChange} placeholder={t?.reports?.to} />
        </FormField>
      </div>
      <div className="flex justify-end pt-2">
        <ExportFormatButton className="w-full sm:w-auto" pending={isExporting} onSelect={onExport} />
      </div>
    </BaseReportModal>
  );
}
