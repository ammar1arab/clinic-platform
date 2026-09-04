'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Button,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  DatePicker,
  DirectorySortMenu,
  DirectoryToolbar,
  DIRECTORY_ACTION_CLASS,
  FormField,
  SoftTip,
} from '@/components/primitives';
import { ExportFormatButton } from '@/components/blocks/reports';
import { FORM_ANY } from '@/constants/form';
import { getGenders, BLOOD_TYPES, getPatientSorts } from '@/constants/patient';
import { ROUTES } from '@/constants/routes';
import { keepNestedPortals } from '@/lib/overlay';
import { cn } from '@/lib/utils';
import type { ClinicStaffMember } from '@/services/clinics.service';
import type { Department } from '@/services/departments.service';
import type { ReportFormat } from '@/services/reports.service';
import { IconClose, IconFilters, IconNewPatient } from '@/constants/icons';
import { useLanguage } from '@/providers';

export type PatientFilterState = {
  search: string;
  status: string;
  gender: string;
  bloodType: string;
  primaryDoctorId: string;
  departmentId: string;
  visitFrom: string;
  visitTo: string;
  dobFrom: string;
  dobTo: string;
  sort: string;
};

function FilterSelect({
  label,
  value,
  onChange,
  placeholder,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const anyText = placeholder ?? t?.common?.any;
  return (
    <FormField label={label} labelClassName="text-xs">
      <Select value={value || FORM_ANY} onValueChange={(v) => onChange(v === FORM_ANY ? '' : v)}>
        <SelectTrigger className="h-8 w-full rounded-lg">
          <SelectValue placeholder={anyText} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FORM_ANY}>{anyText}</SelectItem>
          {children}
        </SelectContent>
      </Select>
    </FormField>
  );
}

type Props = {
  values: PatientFilterState;
  onChange: (patch: Partial<PatientFilterState>) => void;
  onReset: () => void;
  staff?: ClinicStaffMember[];
  departments?: Department[];
  exportDisabled?: boolean;
  onExport?: (format: ReportFormat) => void;
};

export function PatientFiltersBlock({
  values,
  onChange,
  onReset,
  staff,
  departments,
  exportDisabled,
  onExport,
}: Props) {
  const { t } = useLanguage();
  const activeCount =
    (values.status !== 'all' ? 1 : 0) +
    (values.gender ? 1 : 0) +
    (values.bloodType ? 1 : 0) +
    (values.primaryDoctorId ? 1 : 0) +
    (values.departmentId ? 1 : 0) +
    (values.visitFrom ? 1 : 0) +
    (values.visitTo ? 1 : 0) +
    (values.dobFrom ? 1 : 0) +
    (values.dobTo ? 1 : 0);

  return (
    <DirectoryToolbar
      search={values.search}
      onSearchChange={(search) => onChange({ search })}
      searchPlaceholder={t?.common?.search}
      actions={
        <>
          <DirectorySortMenu
            value={values.sort}
            onChange={(sort) => onChange({ sort })}
            options={getPatientSorts(t).map(s => ({ ...s, label: t?.constants?.patientSorts?.[s.value] ?? s.label }))}
          />

          <Popover>
            <SoftTip label={t?.common?.filters}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={t?.common?.filters}
                  className={cn(
                    DIRECTORY_ACTION_CLASS,
                    'border-border/70 bg-background/50',
                    activeCount > 0 && 'border-primary/35 bg-primary/5',
                  )}
                >
                  <IconFilters className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="hidden font-semibold sm:inline">{t?.common?.filters}</span>
                  {activeCount > 0 ? (
                    <Badge variant="info" className="ms-0 h-5 min-w-5 justify-center px-1 text-xs">
                      {activeCount}
                    </Badge>
                  ) : null}
                </Button>
              </PopoverTrigger>
            </SoftTip>
            <PopoverContent
              align="end"
              className="w-80 max-h-[min(32rem,calc(100dvh-var(--app-header-height)-2rem))] space-y-3 overflow-y-auto"
              onInteractOutside={keepNestedPortals}
              onFocusOutside={keepNestedPortals}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t?.common?.filters}</p>
                {activeCount > 0 ? (
                  <Button variant="ghost" size="xs" onClick={onReset}>
                    <IconClose className="size-3.5" />
                    {t?.common?.clear}
                  </Button>
                ) : null}
              </div>

              <FormField label={t?.common?.status} labelClassName="text-xs">
                <Select
                  value={values.status}
                  onValueChange={(v) => onChange({ status: v })}
                >
                  <SelectTrigger className="h-8 w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t?.common?.allStatus}</SelectItem>
                    <SelectItem value="active">{t?.common?.active}</SelectItem>
                    <SelectItem value="inactive">{t?.common?.inactive}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FilterSelect
                label={t?.patient?.practitioner ?? t?.practitioner?.practitioner}
                value={values.primaryDoctorId}
                onChange={(primaryDoctorId) => onChange({ primaryDoctorId })}
              >
                {staff?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </FilterSelect>

              <FilterSelect
                label={t?.practitioner?.department}
                value={values.departmentId}
                onChange={(departmentId) => onChange({ departmentId })}
              >
                {departments?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </FilterSelect>

              <div className="grid grid-cols-2 gap-3">
                <FilterSelect
                  label={t?.common?.gender}
                  value={values.gender}
                  onChange={(gender) => onChange({ gender })}
                >
                  {getGenders(t).map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {t?.constants?.gender?.[g.value] ?? g.label}
                    </SelectItem>
                  ))}
                </FilterSelect>

                <FilterSelect
                  label={t?.patient?.bloodType}
                  value={values.bloodType}
                  onChange={(bloodType) => onChange({ bloodType })}
                >
                  {BLOOD_TYPES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </FilterSelect>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label={t?.patient?.visitFrom} labelClassName="text-xs">
                  <DatePicker
                    value={values.visitFrom}
                    onChange={(v) => onChange({ visitFrom: v })}
                    placeholder={t?.common?.from}
                  />
                </FormField>
                <FormField label={t?.patient?.visitTo} labelClassName="text-xs">
                  <DatePicker
                    value={values.visitTo}
                    onChange={(v) => onChange({ visitTo: v })}
                    placeholder={t?.common?.to}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label={t?.patient?.bornAfter} labelClassName="text-xs">
                  <DatePicker
                    value={values.dobFrom}
                    onChange={(v) => onChange({ dobFrom: v })}
                    placeholder={t?.common?.from}
                    withDropdown
                    toDate={new Date()}
                  />
                </FormField>
                <FormField label={t?.patient?.bornBefore} labelClassName="text-xs">
                  <DatePicker
                    value={values.dobTo}
                    onChange={(v) => onChange({ dobTo: v })}
                    placeholder={t?.common?.to}
                    withDropdown
                    toDate={new Date()}
                  />
                </FormField>
              </div>
            </PopoverContent>
          </Popover>

          {onExport ? (
            <ExportFormatButton
              compact
              className="shrink-0"
              disabled={exportDisabled}
              onSelect={onExport}
            />
          ) : null}

          <SoftTip label={t?.patient?.addPatient}>
            <Button asChild size="sm" className={DIRECTORY_ACTION_CLASS}>
              <Link href={ROUTES.PATIENT_NEW} aria-label={t?.patient?.addPatient}>
                <IconNewPatient className="size-3.5 shrink-0" />
                <span className="hidden font-semibold sm:inline">{t?.patient?.patient}</span>
              </Link>
            </Button>
          </SoftTip>
        </>
      }
    />
  );
}
