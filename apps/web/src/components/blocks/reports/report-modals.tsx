"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  FormField,
  DatePicker,
  FormSkeleton,
  EmptyState,
  ErrorState,
} from "@/components/primitives";
import { PatientCombobox } from "@/components/blocks/appointments";
import { DoctorCombobox } from "@/components/blocks/appointments/shared/doctor-combobox";
import { DateRangePresets, ExportFormatButton } from "./report-controls";
import { FORM_ANY } from "@/constants/form";
import { STATUS_OPTIONS } from "@/constants/appointment";
import type { Patient } from "@/services/patients.service";
import type { Practitioner } from "@/services/practitioners.service";
import type { ReportFormat } from "@/services/reports.service";
import { useLanguage } from "@/providers";
import type { LucideIcon } from "@/constants/icons";

export type ReportModalFilters = {
  patient?: "required" | "optional";
  practitioner?: "required" | "optional";
  dates?: boolean;
  status?: boolean;
};

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
  filters?: ReportModalFilters;
  patients?: Patient[];
  practitioners?: Practitioner[];
  patientId?: string;
  onPatientChange?: (id: string) => void;
  practitionerId?: string;
  onPractitionerChange?: (id: string) => void;
  fromDate?: string;
  toDate?: string;
  onFromChange?: (value: string) => void;
  onToChange?: (value: string) => void;
  status?: string;
  onStatusChange?: (value: string) => void;
  helperText?: string;
  exportDisabled?: boolean;
  isExporting?: boolean;
  onExport?: (format: ReportFormat) => void;
  children?: React.ReactNode;
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
  filters,
  patients,
  practitioners,
  patientId = "",
  onPatientChange,
  practitionerId = "",
  onPractitionerChange,
  fromDate = "",
  toDate = "",
  onFromChange,
  onToChange,
  status = "",
  onStatusChange,
  helperText,
  exportDisabled,
  isExporting,
  onExport,
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
          <div className="flex flex-col gap-6 py-2">
            {filters?.dates && onFromChange && onToChange ? (
              <>
                <DateRangePresets
                  onPick={(from: string, to: string) => {
                    onFromChange(from);
                    onToChange(to);
                  }}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField label={t.reports.from} labelClassName="text-xs">
                    <DatePicker
                      value={fromDate}
                      onChange={onFromChange}
                      placeholder={t.reports.from}
                    />
                  </FormField>
                  <FormField label={t.reports.to} labelClassName="text-xs">
                    <DatePicker
                      value={toDate}
                      onChange={onToChange}
                      placeholder={t.reports.to}
                    />
                  </FormField>
                </div>
              </>
            ) : null}

            {filters?.patient && onPatientChange ? (
              <FormField
                label={
                  filters.patient === "optional"
                    ? `${t.patient.patient} (${t.common.optional})`
                    : t.patient.patient
                }
                labelClassName="text-xs"
              >
                <PatientCombobox
                  patients={patients}
                  value={patientId}
                  onChange={onPatientChange}
                  placeholder={
                    filters.patient === "optional"
                      ? t.reports.allPatients
                      : t.reports.selectPatient
                  }
                  allowClear={filters.patient === "optional"}
                />
              </FormField>
            ) : null}

            {filters?.practitioner && onPractitionerChange ? (
              <FormField
                label={
                  filters.practitioner === "optional"
                    ? `${t.practitioner.practitioner} (${t.common.optional})`
                    : t.practitioner.practitioner
                }
                labelClassName="text-xs"
              >
                <DoctorCombobox
                  doctors={practitioners}
                  value={practitionerId}
                  onChange={onPractitionerChange}
                  placeholder={
                    filters.practitioner === "optional"
                      ? t.reports.allPractitioners
                      : t.reports.selectPractitioner
                  }
                />
              </FormField>
            ) : null}

            {filters?.status && onStatusChange ? (
              <FormField label={t.reports.status} labelClassName="text-xs">
                <Select
                  value={status || FORM_ANY}
                  onValueChange={(value) =>
                    onStatusChange(value === FORM_ANY ? "" : value)
                  }
                >
                  <SelectTrigger className="h-8 w-full rounded-lg">
                    <SelectValue placeholder={t.reports.allStatuses} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FORM_ANY}>
                      {t.reports.allStatuses}
                    </SelectItem>
                    {STATUS_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t.constants.status[value]?.label ?? value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            ) : null}

            {helperText ? (
              <p className="text-sm text-muted-foreground">{helperText}</p>
            ) : null}

            {children}

            {onExport ? (
              <div className="flex justify-end">
                <ExportFormatButton
                  className="w-full sm:w-auto"
                  pending={isExporting}
                  disabled={exportDisabled}
                  onSelect={onExport}
                />
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
