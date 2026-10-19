"use client";

import { Controller, useFormContext } from "react-hook-form";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/ui";
import {
  DatePicker,
  ErrorState,
  FormField,
  MultiSelect,
  SearchablePicker,
  SearchInput,
  OverflowActions,
  DIRECTORY_FILTER_BADGE_CLASS,
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
import { IconFilters } from "@/constants/icons";
import { keepNestedPortals } from "@/lib/overlay";
import { cn } from "@/lib/utils";
import type { EmailComposerValues } from "@/lib/validations";

const AUDIENCE = {
  ...EMAIL_AUDIENCE,
  ALL: "all",
} as const;

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
    audience === AUDIENCE.STAFF && watched.roles.length > 0,
    isPatients && watched.appointmentStatuses.length > 0,
    isPatients && Boolean(watched.appointmentFrom),
    isPatients && Boolean(watched.appointmentTo),
    isPatients && watched.isPaid !== PAYMENT.ALL,
  ].filter(Boolean).length;
  const clearFilters = () => {
    setValue("departmentId", "");
    setValue("doctorId", "");
    setValue("serviceId", "");
    setValue("roles", []);
    setValue("appointmentStatuses", []);
    setValue("appointmentFrom", "");
    setValue("appointmentTo", "");
    setValue("isPaid", PAYMENT.ALL);
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
      <CardHeader>
        <CardTitle className="text-sm">{t.emails.recipients}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField>
          <Controller
            control={control}
            name="audience"
            render={({ field }) => (
              <OverflowActions label={t.emails.audience}>
                {audiences.isLoading
                  ? Array.from({ length: 7 }, (_, index) => (
                      <Skeleton
                        key={index}
                        className="h-7 w-20 shrink-0 rounded-md"
                      />
                    ))
                  : (audiences.data?.audiences ?? []).map((key) => (
                      <Button
                        key={key}
                        type="button"
                        size="sm"
                        className="shrink-0"
                        variant={field.value === key ? "default" : "outline"}
                        aria-pressed={field.value === key}
                        onClick={() => {
                          if (field.value === key) return;
                          field.onChange(key);
                          setValue("ids", []);
                          clearFilters();
                          setValue("search", "");
                        }}
                      >
                        {t.emails[key]}
                      </Button>
                    ))}
              </OverflowActions>
            )}
          />
        </FormField>
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
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                aria-label={t.common.filters}
                className={cn(
                  'gap-2',
                  activeFilters > 0
                    ? 'max-sm:h-8 max-sm:w-auto max-sm:gap-1 max-sm:px-2'
                    : 'max-sm:size-8 max-sm:p-0',
                )}
              >
                <IconFilters className="size-4" />
                <span className="hidden sm:inline">{t.common.filters}</span>
                {activeFilters > 0 && (
                  <Badge variant="info" className={DIRECTORY_FILTER_BADGE_CLASS}>{activeFilters}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80 max-h-[min(32rem,calc(100dvh-8rem))] space-y-3 overflow-y-auto"
              onInteractOutside={keepNestedPortals}
              onFocusOutside={keepNestedPortals}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t.common.filters}</p>
                {activeFilters > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    {t.common.clear}
                  </Button>
                )}
              </div>
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
              {audience === AUDIENCE.STAFF && (
                <FormField label={t.emails.roles}>
                  <Controller
                    control={control}
                    name="roles"
                    render={({ field }) => (
                      <MultiSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={Object.entries(t.emails.roleLabels).map(
                          ([value, label]) => ({ value, label }),
                        )}
                      />
                    )}
                  />
                </FormField>
              )}
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
                          options={STATUS_OPTIONS.map((status) => ({
                            value: status,
                            label: statuses[status].label,
                          }))}
                        />
                      )}
                    />
                  </FormField>
                  <FormField label={t.emails.paid}>
                    <Controller
                      control={control}
                      name="isPaid"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={PAYMENT.ALL}>
                              {t.emails.anyPayment}
                            </SelectItem>
                            <SelectItem value={PAYMENT.YES}>
                              {t.emails.paidYes}
                            </SelectItem>
                            <SelectItem value={PAYMENT.NO}>
                              {t.emails.paidNo}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
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
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}
