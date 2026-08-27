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
import { GENDERS } from '@/constants/patient';
import {
  PRACTITIONER_EMPLOYMENT_LABEL,
  PRACTITIONER_EXPERIENCE_FILTERS,
  PRACTITIONER_LANGUAGES,
  PRACTITIONER_LICENSE_FILTERS,
  PRACTITIONER_SORTS,
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
  return (
    <FormField label={label} labelClassName="text-xs">
      <Select value={value || FORM_ANY} onValueChange={(v) => onChange(v === FORM_ANY ? '' : v)}>
        <SelectTrigger className="h-8 w-full rounded-lg">
          <SelectValue placeholder={placeholder ?? 'Any'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FORM_ANY}>Any</SelectItem>
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
      searchPlaceholder="Search practitioners…"
      actions={
        <>
          <DirectorySortMenu
            value={values.sort}
            onChange={(sort) => onChange({ sort })}
            options={PRACTITIONER_SORTS}
          />

          <Popover>
            <SoftTip label="Filters">
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Filters"
                  className={cn(
                    DIRECTORY_ACTION_CLASS,
                    'border-border/70 bg-background/50',
                    activeCount > 0 && 'border-primary/35 bg-primary/5',
                  )}
                >
                  <IconFilters className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="hidden font-semibold sm:inline">Filters</span>
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
                <p className="text-sm font-medium">Filters</p>
                {activeCount > 0 ? (
                  <Button variant="ghost" size="xs" onClick={onReset}>
                    <IconClose className="size-3.5" />
                    Clear
                  </Button>
                ) : null}
              </div>

              <FormField label="Status" labelClassName="text-xs">
                <Select
                  value={values.status}
                  onValueChange={(status) => onChange({ status })}
                >
                  <SelectTrigger className="h-8 w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FilterSelect
                label="Department"
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
                label="Employment"
                value={values.employmentType}
                onChange={(employmentType) => onChange({ employmentType })}
              >
                {Object.entries(PRACTITIONER_EMPLOYMENT_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </FilterSelect>

              <div className="grid grid-cols-2 gap-3">
                <FilterSelect
                  label="Gender"
                  value={values.gender}
                  onChange={(gender) => onChange({ gender })}
                >
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </FilterSelect>

                <FilterSelect
                  label="Language"
                  value={values.language}
                  onChange={(language) => onChange({ language })}
                >
                  {PRACTITIONER_LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </FilterSelect>
              </div>

              <FilterSelect
                label="Specialty"
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
                label="Default room"
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
                label="Nationality"
                value={values.nationality}
                onChange={(nationality) => onChange({ nationality })}
              >
                {nationalities.map((code) => (
                  <SelectItem key={code} value={code}>
                    {countryLabel(code) ?? code}
                  </SelectItem>
                ))}
              </FilterSelect>

              <FormField label="License" labelClassName="text-xs">
                <Select
                  value={values.license}
                  onValueChange={(license) => onChange({ license })}
                >
                  <SelectTrigger className="h-8 w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRACTITIONER_LICENSE_FILTERS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
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
                    {PRACTITIONER_EXPERIENCE_FILTERS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
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

          <SoftTip label="Add practitioner">
            <Button asChild size="sm" className={DIRECTORY_ACTION_CLASS}>
              <Link href={ROUTES.PRACTITIONERS_NEW} aria-label="Add practitioner">
                <IconAdd className="size-3.5 shrink-0" />
                <span className="hidden font-semibold sm:inline">Practitioner</span>
              </Link>
            </Button>
          </SoftTip>
        </>
      }
    />
  );
}
