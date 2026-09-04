'use client';

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
      searchPlaceholder={t?.common?.search ?? "Search by name, phone, ID, or email…"}
      actions={
        <>
          <DirectorySortMenu
            value={values.sort}
            onChange={(sort) => onChange({ sort })}
            options={getPatientSorts(t).map(s => ({ ...s, label: t?.constants?.patientSorts?.[s.value] ?? s.label }))}
          />

          <Popover>
            <SoftTip label={t?.common?.filters ?? "Filters"}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={t?.common?.filters ?? "Filters"}
                  className={cn(
                    DIRECTORY_ACTION_CLASS,
                    'border-border/70 bg-background/50',
                    activeCount > 0 && 'border-primary/35 bg-primary/5',
                  )}
                >
                  <IconFilters className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="hidden font-semibold sm:inline">{t?.common?.filters ?? "Filters"}</span>
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
                <p className="text-sm font-medium">{t?.common?.filters ?? "Filters"}</p>
                {activeCount > 0 ? (
                  <Button variant="ghost" size="xs" onClick={onReset}>
                    <IconClose className="size-3.5" />
                    {t?.common?.clear ?? "Clear"}
                  </Button>
                ) : null}
              </div>

              <FormField label={t?.common?.status ?? "Status"} labelClassName="text-xs">
                <Select
                  value={values.status}
                  onValueChange={(v) => onChange({ status: v })}
                >
                  <SelectTrigger className="h-8 w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t?.common?.allStatus ?? "All Status"}</SelectItem>
                    <SelectItem value="active">{t?.common?.active ?? "Active"}</SelectItem>
                    <SelectItem value="inactive">{t?.common?.inactive ?? "Inactive"}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label={t?.patient?.practitioner ?? t?.practitioner?.practitioner ?? "Practitioner"} labelClassName="text-xs">
                <Select
                  value={values.primaryDoctorId || FORM_ANY}
                  onValueChange={(v) =>
                    onChange({ primaryDoctorId: v === FORM_ANY ? '' : v })
                  }
                >
                  <SelectTrigger className="h-8 w-full rounded-lg">
                    <SelectValue placeholder={t?.common?.any ?? "Any"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FORM_ANY}>{t?.common?.any ?? "Any"}</SelectItem>
                    {staff?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label={t?.practitioner?.department ?? "Department"} labelClassName="text-xs">
                <Select
                  value={values.departmentId || FORM_ANY}
                  onValueChange={(v) =>
                    onChange({ departmentId: v === FORM_ANY ? '' : v })
                  }
                >
                  <SelectTrigger className="h-8 w-full rounded-lg">
                    <SelectValue placeholder={t?.common?.any ?? "Any"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FORM_ANY}>{t?.common?.any ?? "Any"}</SelectItem>
                    {departments?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label={t?.common?.gender ?? "Gender"} labelClassName="text-xs">
                  <Select
                    value={values.gender || FORM_ANY}
                    onValueChange={(v) =>
                      onChange({ gender: v === FORM_ANY ? '' : v })
                    }
                  >
                    <SelectTrigger className="h-8 w-full rounded-lg">
                      <SelectValue placeholder={t?.common?.any ?? "Any"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FORM_ANY}>{t?.common?.any ?? "Any"}</SelectItem>
                      {getGenders(t).map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {t?.constants?.gender?.[g.value] ?? g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label={t?.patient?.bloodType ?? "Blood Type"} labelClassName="text-xs">
                  <Select
                    value={values.bloodType || FORM_ANY}
                    onValueChange={(v) =>
                      onChange({ bloodType: v === FORM_ANY ? '' : v })
                    }
                  >
                    <SelectTrigger className="h-8 w-full rounded-lg">
                      <SelectValue placeholder={t?.common?.any ?? "Any"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FORM_ANY}>{t?.common?.any ?? "Any"}</SelectItem>
                      {BLOOD_TYPES.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label={t?.patient?.visitFrom ?? "Visit from"} labelClassName="text-xs">
                  <DatePicker
                    value={values.visitFrom}
                    onChange={(v) => onChange({ visitFrom: v })}
                    placeholder={t?.common?.from ?? "From"}
                  />
                </FormField>
                <FormField label={t?.patient?.visitTo ?? "Visit to"} labelClassName="text-xs">
                  <DatePicker
                    value={values.visitTo}
                    onChange={(v) => onChange({ visitTo: v })}
                    placeholder={t?.common?.to ?? "To"}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label={t?.patient?.bornAfter ?? "Born after"} labelClassName="text-xs">
                  <DatePicker
                    value={values.dobFrom}
                    onChange={(v) => onChange({ dobFrom: v })}
                    placeholder={t?.common?.from ?? "From"}
                    withDropdown
                    toDate={new Date()}
                  />
                </FormField>
                <FormField label={t?.patient?.bornBefore ?? "Born before"} labelClassName="text-xs">
                  <DatePicker
                    value={values.dobTo}
                    onChange={(v) => onChange({ dobTo: v })}
                    placeholder={t?.common?.to ?? "To"}
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

          <SoftTip label={t?.patient?.addPatient ?? "Add patient"}>
            <Button asChild size="sm" className={DIRECTORY_ACTION_CLASS}>
              <Link href={ROUTES.PATIENT_NEW} aria-label={t?.patient?.addPatient ?? "Add patient"}>
                <IconNewPatient className="size-3.5 shrink-0" />
                <span className="hidden font-semibold sm:inline">{t?.patient?.patient ?? "Patient"}</span>
              </Link>
            </Button>
          </SoftTip>
        </>
      }
    />
  );
}
