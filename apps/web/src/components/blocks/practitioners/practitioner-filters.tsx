'use client';


import Link from 'next/link';
import {
  Button,
  Popover,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  DirectoryToolbar,
  FilterPanel,
  FilterTrigger,
  DIRECTORY_ACTION_CLASS,
  FormField,
  FilterSelect,
  SoftTip,
  countryLabel,
} from '@/components/primitives';
import { ExportFormatButton } from '@/components/blocks/reports';
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
import type { Department } from '@/services/departments.service';
import type { Practitioner } from '@/services/practitioners.service';
import type { Room } from '@/services/rooms.service';
import type { ReportFormat } from '@/services/reports.service';
import { IconAdd } from '@/constants/icons';
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
  searchLoading?: boolean;
};


export function PractitionerFiltersBlock({
  values,
  onChange,
  onReset,
  practitioners,
  departments,
  rooms,
  exportDisabled,
  onExport,
  searchLoading,
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
      searchPlaceholder={t.common.search}
      searchLoading={searchLoading}
      actions={
        <>
          <Popover>
              <FilterTrigger count={activeCount} />
            <FilterPanel count={activeCount} onClear={onReset}>

              <FormField label={t?.common?.sort} labelClassName="text-xs">
                <Select
                  value={values.sort}
                  onValueChange={(sort) => onChange({ sort })}
                >
                  <SelectTrigger className="h-8 w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getPractitionerSorts(t).map((sort) => (
                      <SelectItem key={sort.value} value={sort.value}>
                        {t?.constants?.practitionerSorts?.[sort.value] ?? sort.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label={t?.common?.status} labelClassName="text-xs">
                <Select
                  value={values.status}
                  onValueChange={(status) => onChange({ status })}
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

              <FilterSelect
                label={t?.practitioner?.employment}
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
                  label={t?.practitioner?.languages}
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
                label={t?.practitioner?.specialty}
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
                label={t?.practitioner?.defaultRoom}
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
                label={t?.practitioner?.nationality}
                value={values.nationality}
                onChange={(nationality) => onChange({ nationality })}
              >
                {nationalities.map((code) => (
                  <SelectItem key={code} value={code}>
                    {countryLabel(code) ?? code}
                  </SelectItem>
                ))}
              </FilterSelect>

              <FormField label={t?.practitioner?.licenseNumber} labelClassName="text-xs">
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
            </FilterPanel>
          </Popover>

          {onExport ? (
            <ExportFormatButton
              compact
              className="shrink-0"
              disabled={exportDisabled}
              onSelect={onExport}
            />
          ) : null}

          <SoftTip label={t?.practitioner?.addPractitioner}>
            <Button asChild size="sm" className={DIRECTORY_ACTION_CLASS}>
              <Link href={ROUTES.PRACTITIONERS_NEW} aria-label={t?.practitioner?.addPractitioner}>
                <IconAdd className="size-3.5 shrink-0" />
                <span className="hidden font-semibold sm:inline">{t?.practitioner?.practitioner}</span>
              </Link>
            </Button>
          </SoftTip>
        </>
      }
    />
  );
}
