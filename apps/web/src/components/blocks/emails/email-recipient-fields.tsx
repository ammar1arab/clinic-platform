"use client";

import { Controller, useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  Popover,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  DatePicker,
  ErrorState,
  FormField,
  MultiSelect,
  OptionList,
  SearchablePicker,
  SearchInput,
  TargetAudience,
  FilterPanel,
  FilterTrigger,
} from "@/components/primitives";
import { useEmailAudiences } from "@/hooks/api/use-emails";
import { useDepartments } from "@/hooks/api/use-departments";
import { useServices } from "@/hooks/api/use-services";
import { useClinicStaff } from "@/hooks/api/use-clinic-staff";
import { useClinicId } from "@/hooks/shared/use-clinic-id";
import { useLanguage } from "@/providers";
import { getBilingualName, getStaffName } from "@/i18n";
import { EMAIL_AUDIENCE, ROLE } from "@clinic/types";
import { getStatusConfig, STATUS_OPTIONS } from "@/constants/appointment";
import type { EmailComposerValues } from "@/lib/validations";

const AUDIENCE = {
  ...EMAIL_AUDIENCE,
  ALL: "all",
} as const;

const AUDIENCE_ORDER = [
  AUDIENCE.OWNERS,
  AUDIENCE.ADMINS,
  AUDIENCE.FINANCIAL,
  AUDIENCE.PRACTITIONERS,
  AUDIENCE.PATIENTS,
] as const;

const PAYMENT = {
  ALL: "all",
  YES: "true",
  NO: "false",
} as const satisfies Record<string, EmailComposerValues["isPaid"]>;

export function EmailRecipientFields({
  searchLoading = false,
}: {
  searchLoading?: boolean;
}) {
  const { t, lang } = useLanguage();
  const clinicId = useClinicId();
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<EmailComposerValues>();
  const audience = watch("audience");
  const audiences = useEmailAudiences(clinicId);
  const departments = useDepartments(clinicId);
  const services = useServices(clinicId);
  const staff = useClinicStaff(clinicId);
  const statuses = getStatusConfig(t);
  const watched = watch();
  const isPatients = audience === AUDIENCE.PATIENTS;
  const activeFilters = [
    Boolean(watched.departmentId),
    isPatients && Boolean(watched.doctorId),
    isPatients && Boolean(watched.serviceId),
    isPatients && watched.appointmentStatuses.length > 0,
    isPatients && Boolean(watched.appointmentFrom),
    isPatients && Boolean(watched.appointmentTo),
    isPatients && watched.isPaid !== PAYMENT.ALL,
  ].filter(Boolean).length;
  const clearFilters = () => {
    setValue("departmentId", "");
    setValue("doctorId", "");
    setValue("serviceId", "");
    setValue("appointmentStatuses", []);
    setValue("appointmentFrom", "");
    setValue("appointmentTo", "");
    setValue("isPaid", PAYMENT.ALL);
  };
  const offered = new Set<string>(audiences.data?.audiences ?? []);
  const audienceKeys = AUDIENCE_ORDER.filter((key) => offered.has(key));
  const changeAudience = (apply: (key: string) => void, key: string) => {
    apply(key);
    setValue("ids", []);
    clearFilters();
    setValue("search", "");
  };
  const pickers = [
    {
      name: "departmentId" as const,
      label: t.emails.department,
      options:
        departments.data
          ?.filter((item) => item.isActive)
          .map((item) => ({
            value: item.id,
            label: getBilingualName(item.name, item.nameAr, lang),
          })) ?? [],
    },
    ...(audience === AUDIENCE.PATIENTS
      ? [
          {
            name: "doctorId" as const,
            label: t.emails.doctor,
            options:
              staff.data
                ?.filter((item) => item.role === ROLE.PRACTITIONER)
                .map((item) => ({
                  value: item.id,
                  label: getStaffName(item, lang),
                })) ?? [],
          },
          {
            name: "serviceId" as const,
            label: t.emails.service,
            options:
              services.data
                ?.filter((item) => item.isActive)
                .map((item) => ({
                  value: item.id,
                  label: getBilingualName(item.name, item.nameAr, lang),
                })) ?? [],
          },
        ]
      : []),
  ];
  return (
    <Card>
      <CardContent className="space-y-4">
        <Controller
          control={control}
          name="audience"
          render={({ field }) => (
            <TargetAudience
              everyoneLabel={t.common.audienceEveryone}
              specificLabel={t.common.audienceSpecific}
              specific={field.value !== AUDIENCE.ALL}
              onSpecificChange={(specific) => changeAudience(field.onChange, specific ? audienceKeys[0] ?? AUDIENCE.ALL : AUDIENCE.ALL)}
              summary={field.value === AUDIENCE.ALL ? t.ui.select : t.emails[field.value]}
            >
              <OptionList
                label={t.common.targetAudience}
                value={[field.value]}
                options={audienceKeys.map((key) => ({ value: key, label: t.emails[key] }))}
                onChange={([key]) => key && changeAudience(field.onChange, key)}
              />
            </TargetAudience>
          )}
        />
        {audiences.isError && (
          <ErrorState onRetry={() => void audiences.refetch()} />
        )}
        {(departments.isError || services.isError || staff.isError) && (
          <ErrorState
            onRetry={() => {
              void departments.refetch();
              void services.refetch();
              void staff.refetch();
            }}
          />
        )}
        <div className="flex flex-wrap items-end gap-3">
          <FormField
            label={t.emails.searchRecipients}
            htmlFor="email-recipient-search"
            error={errors.search?.message}
            className="min-w-0 flex-1"
          >
            <Controller
              control={control}
              name="search"
              render={({ field }) => (
                <SearchInput
                  id="email-recipient-search"
                  value={field.value}
                  onChange={field.onChange}
                  loading={searchLoading}
                  className="w-full"
                />
              )}
            />
          </FormField>
          <Popover>
            <FilterTrigger count={activeFilters} />
            <FilterPanel count={activeFilters} onClear={clearFilters}>
              {pickers.map((picker) => (
                <FormField key={picker.name} label={picker.label}>
                  <Controller
                    control={control}
                    name={picker.name}
                    render={({ field }) => (
                      <SearchablePicker
                        value={field.value}
                        onChange={field.onChange}
                        options={picker.options}
                        extraOption={{ value: "", label: t.common.all }}
                        className="w-full"
                      />
                    )}
                  />
                </FormField>
              ))}
              {audience === AUDIENCE.PATIENTS && (
                <>
                  <FormField label={t.emails.appointmentStatuses}>
                    <Controller
                      control={control}
                      name="appointmentStatuses"
                      render={({ field }) => (
                        <MultiSelect
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t.common.all}
                          options={STATUS_OPTIONS.map((status) => ({
                            value: status,
                            label: statuses[status].label,
                          }))}
                          className="w-full"
                        />
                      )}
                    />
                  </FormField>
                  <FormField label={t.emails.paid}>
                    <Controller
                      control={control}
                      name="isPaid"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-8 w-full rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={PAYMENT.ALL}>{t.emails.anyPayment}</SelectItem>
                            <SelectItem value={PAYMENT.YES}>{t.emails.paidYes}</SelectItem>
                            <SelectItem value={PAYMENT.NO}>{t.emails.paidNo}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label={t.emails.appointmentFrom}>
                      <Controller
                        control={control}
                        name="appointmentFrom"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </FormField>
                    <FormField
                      label={t.emails.appointmentTo}
                      error={errors.appointmentTo?.message}
                    >
                      <Controller
                        control={control}
                        name="appointmentTo"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </FormField>
                  </div>
                </>
              )}
            </FilterPanel>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}
