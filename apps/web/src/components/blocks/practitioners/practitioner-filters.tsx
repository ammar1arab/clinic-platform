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
  DirectorySortMenu,
  DirectoryToolbar,
  DIRECTORY_ACTION_CLASS,
  FormField,
  SoftTip,
  countryLabel,
} from '@/components/primitives';
import { ExportFormatButton } from '@/components/blocks/reports';
import { FORM_ANY } from '@/constants/form';
import { getGenders } from '@/constants/patient';
import {
  getPractitionerEmploymentLabels,
  getPractitionerExperienceFilters,
  getPractitionerLanguages,
  getPractitionerLicenseFilters,
  getPractitionerSorts,
  uniqueSorted,
  type PractitionerFilterState,
} from '@/constants/practitioner';
import { ROUTES } from '@/constants/routes';
import { keepNestedPortals } from '@/lib/overlay';
import { cn } from '@/lib/utils';
import type { Department } from '@/services/departments.service';
import type { Practitioner } from '@/services/practitioners.service';
import type { Room } from '@/services/rooms.service';
import type { ReportFormat } from '@/services/reports.service';
import { IconAdd, IconClose, IconFilters } from '@/constants/icons';
import { useLanguage } from '@/providers';

type Props = {
  values: PractitionerFilterState;
  onChange: (patch: Partial<PractitionerFilterState>) => void;
  onReset: () => void;
  practitioners?: Practitioner[];
  departments?: Department[];
  rooms?: Room[];
  exportDisabled?: boolean;
  onExport?: (format: ReportFormat) => void;
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
  const anyText = placeholder ?? t?.common?.any ?? 'Any';
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

export function PractitionerFiltersBlock({
  values,
  onChange,
  onReset,
  practitioners,
  departments,
  rooms,
  exportDisabled,
  onExport,
}: Props) {
  const { t } = useLanguage();

  const specialties = uniqueSorted(practitioners?.map((p) => p.specialty));
  const nationalities = uniqueSorted(practitioners?.map((p) => p.nationality));

  const activeCount =
    (values.status !== 'all' ? 1 : 0) +
    (values.departmentId ? 1 : 0) +
    (values.employmentType ? 1 : 0) +
    (values.gender ? 1 : 0) +
    (values.language ? 1 : 0) +
    (values.specialty ? 1 : 0) +
    (values.roomId ? 1 : 0) +
    (values.nationality ? 1 : 0) +
    (values.license !== 'all' ? 1 : 0) +
    (values.experience !== 'all' ? 1 : 0);

  return (
    <DirectoryToolbar
      search={values.search}
      onSearchChange={(search) => onChange({ search })}
      searchPlaceholder={t?.common?.search || "Search practitioners…"}
      actions={
        <>
          <DirectorySortMenu
            value={values.sort}
            onChange={(sort) => onChange({ sort })}
            options={getPractitionerSorts(t).map(s => ({ ...s, label: t?.constants?.practitionerSorts?.[s.value] ?? s.label }))}
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
                  onValueChange={(status) => onChange({ status })}
                >
                  <SelectTrigger className="h-8 w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t?.common?.allStatus ?? "All status"}</SelectItem>
                    <SelectItem value="active">{t?.common?.active ?? "Active"}</SelectItem>
                    <SelectItem value="inactive">{t?.common?.inactive ?? "Inactive"}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FilterSelect
                label={t?.practitioner?.department ?? "Department"}
                value={values.departmentId}
                onChange={(departmentId) => onChange({ departmentId })}
              >
                {departments?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </FilterSelect>

              <FilterSelect
                label={t?.practitioner?.employment ?? "Employment"}
                value={values.employmentType}
                onChange={(employmentType) => onChange({ employmentType })}
              >
                {Object.entries(getPractitionerEmploymentLabels(t)).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {(t?.constants?.employment as Record<string, string>)?.[value] ?? label}
                  </SelectItem>
                ))}
              </FilterSelect>

              <div className="grid grid-cols-2 gap-3">
                <FilterSelect
                  label={t?.common?.gender ?? "Gender"}
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
                  label={t?.practitioner?.languages ?? "Language"}
                  value={values.language}
                  onChange={(language) => onChange({ language })}
                >
                  {getPractitionerLanguages(t).map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {t?.constants?.languages?.[l.value] ?? l.label}
                    </SelectItem>
                  ))}
                </FilterSelect>
              </div>

              <FilterSelect
                label={t?.practitioner?.specialty ?? "Specialty"}
                value={values.specialty}
                onChange={(specialty) => onChange({ specialty })}
              >
                {specialties.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </FilterSelect>

              <FilterSelect
                label={t?.practitioner?.defaultRoom ?? "Default room"}
                value={values.roomId}
                onChange={(roomId) => onChange({ roomId })}
              >
                {rooms?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </FilterSelect>

              <FilterSelect
                label={t?.practitioner?.nationality ?? "Nationality"}
                value={values.nationality}
                onChange={(nationality) => onChange({ nationality })}
              >
                {nationalities.map((code) => (
                  <SelectItem key={code} value={code}>
                    {countryLabel(code) ?? code}
                  </SelectItem>
                ))}
              </FilterSelect>

              <FormField label={t?.practitioner?.licenseNumber ?? "License"} labelClassName="text-xs">
                <Select
                  value={values.license}
                  onValueChange={(license) => onChange({ license })}
                >
                  <SelectTrigger className="h-8 w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getPractitionerLicenseFilters(t).map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {t?.constants?.licenseFilters?.[item.value] ?? item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Experience" labelClassName="text-xs">
                <Select
                  value={values.experience}
                  onValueChange={(experience) => onChange({ experience })}
                >
                  <SelectTrigger className="h-8 w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getPractitionerExperienceFilters(t).map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {t?.constants?.experienceFilters?.[item.value] ?? item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
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

          <SoftTip label={t?.practitioner?.addPractitioner ?? "Add practitioner"}>
            <Button asChild size="sm" className={DIRECTORY_ACTION_CLASS}>
              <Link href={ROUTES.PRACTITIONERS_NEW} aria-label={t?.practitioner?.addPractitioner ?? "Add practitioner"}>
                <IconAdd className="size-3.5 shrink-0" />
                <span className="hidden font-semibold sm:inline">{t?.practitioner?.practitioner ?? "Practitioner"}</span>
              </Link>
            </Button>
          </SoftTip>
        </>
      }
    />
  );
}
