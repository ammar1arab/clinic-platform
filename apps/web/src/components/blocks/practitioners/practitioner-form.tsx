'use client';

import { useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Input,
  Textarea,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  FormField,
  FormActions,
  BilingualNameFields,
  PhoneInputField,
  CountrySelect,
  DatePicker,
  MultiSelect,
  AvatarUpload,
} from '@/components/primitives';
import { FORM_NONE } from '@/constants/form';
import { getPractitionerLanguages } from '@/constants/practitioner';
import { getGenders } from '@/constants/patient';
import { practitionerSchema, type PractitionerFormData } from '@/lib/validations';
import { useCreatePractitioner, useUpdatePractitioner } from '@/hooks/api/use-practitioners';
import { useDepartments } from '@/hooks/api/use-departments';
import { useRooms } from '@/hooks/api/use-rooms';
import { useServices } from '@/hooks/api/use-services';
import { useConfirm, useLanguage } from '@/providers';
import { getBilingualName } from '@/i18n';
import type { PractitionerDetail } from '@/services/practitioners.service';
import {
  emptyPractitionerValues,
  toPractitionerFormValues,
  toPractitionerPayload,
} from './practitioner-form.mapper';
import { LeaveBlocksFields, WeeklyAvailabilityFields } from './practitioner-schedule-fields';

type Props = {
  clinicId: string;
  practitioner?: PractitionerDetail;
  onCancel: () => void;
  onSuccess: (id: string) => void;
};

export function PractitionerForm({ clinicId, practitioner, onCancel, onSuccess }: Props) {
  const isEdit = !!practitioner;
  const confirm = useConfirm();
  const { t, lang } = useLanguage();

  const { data: departments } = useDepartments(clinicId);
  const { data: rooms } = useRooms(clinicId);
  const { data: services } = useServices(clinicId);
  const createMutation = useCreatePractitioner(clinicId);
  const updateMutation = useUpdatePractitioner(clinicId);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<PractitionerFormData>({
    resolver: zodResolver(practitionerSchema) as never,
    defaultValues: practitioner
      ? toPractitionerFormValues(practitioner)
      : emptyPractitionerValues(),
  });

  const availabilities = useFieldArray({ control, name: 'availabilities' });
  const timeOffs = useFieldArray({ control, name: 'timeOffs' });

  const departmentId = watch('departmentId');
  const imageUrl = watch('imageUrl');
  const name = watch('name');
  const employmentType = watch('employmentType');
  const needsCommission = employmentType === 'commission' || employmentType === 'mixed';

  const roomOptions = useMemo(() => {
    const list = (rooms ?? []).filter((r) => r.isActive);
    if (!departmentId) return list;
    return list.filter((r) => !r.departmentId || r.departmentId === departmentId);
  }, [rooms, departmentId]);

  const serviceOptions = useMemo(
    () =>
      (services ?? [])
        .filter((s) => s.isActive)
        .map((s) => ({
          value: s.id,
          label: getBilingualName(s.name, s.nameAr, lang),
        })),
    [services, lang],
  );

  const pending = createMutation.isPending || updateMutation.isPending;

  const removeAvailability = async (index: number) => {
    const ok = await confirm({
      title: t.practitioner.removeAvailabilityTitle,
      description: t.practitioner.removeAvailabilityDesc,
      confirmLabel: t.common.remove,
      variant: 'destructive',
    });
    if (ok) availabilities.remove(index);
  };

  const removeTimeOff = async (index: number) => {
    const ok = await confirm({
      title: t.practitioner.removeLeaveTitle,
      description: t.practitioner.removeLeaveDesc,
      confirmLabel: t.common.remove,
      variant: 'destructive',
    });
    if (ok) timeOffs.remove(index);
  };

  const onSubmit = (data: PractitionerFormData) => {
    if (!isEdit && !data.email?.trim()) {
      setError('email', { message: t.practitioner.emailRequired });
      return;
    }

    const base = toPractitionerPayload(data);

    if (isEdit && practitioner) {
      updateMutation.mutate(
        { id: practitioner.id, data: base },
        { onSuccess: (res) => onSuccess(res.id) },
      );
      return;
    }

    createMutation.mutate(
      { clinicId, email: data.email!.trim(), ...base },
      {
        onSuccess: async (res) => {
          if (res.welcomeEmailSent) toast.success(t.practitioner.welcomeEmailSentToast);
          await confirm({
            title: t.practitioner.created,
            description: t.practitioner.credentialsAreEmail,
            confirmLabel: t.practitioner.viewProfile,
            hideCancel: true,
          });
          onSuccess(res.practitioner.id);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-4" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t.practitioner.overview}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField error={errors.imageUrl?.message} className="sm:col-span-2">
            <AvatarUpload
              value={imageUrl}
              onChange={(url) =>
                setValue('imageUrl', url, { shouldValidate: true, shouldDirty: true })
              }
              fallbackLabel={name || 'DR'}
              disabled={pending}
            />
          </FormField>

          <BilingualNameFields
            className="sm:col-span-2"
            name={watch('name')}
            nameAr={watch('nameAr') ?? ''}
            onNameChange={(v) => setValue('name', v, { shouldValidate: true })}
            onNameArChange={(v) => setValue('nameAr', v, { shouldValidate: true })}
            englishError={errors.name?.message}
            arabicError={errors.nameAr?.message}
          />

          <FormField label={t.practitioner.nameTitle} error={errors.title?.message}>
            <Input placeholder={t.practitioner.nameTitlePlaceholder} {...register('title')} />
          </FormField>
          <FormField label={t.practitioner.nationality} error={errors.nationality?.message}>
            <Controller
              control={control}
              name="nationality"
              render={({ field }) => (
                <CountrySelect
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t.common.selectCountry}
                  disabled={pending}
                />
              )}
            />
          </FormField>
          <FormField label={t.practitioner.specialty} error={errors.specialty?.message}>
            <Input placeholder={t.practitioner.specialtyPlaceholder} {...register('specialty')} />
          </FormField>
          <FormField label={t.practitioner.specialtyAr} error={errors.specialtyAr?.message}>
            <Input dir="rtl" placeholder={t.practitioner.specialtyArPlaceholder} {...register('specialtyAr')} />
          </FormField>
          <FormField label={t.practitioner.email} required={!isEdit} error={errors.email?.message}>
            <Input type="email" disabled={isEdit} {...register('email')} />
          </FormField>
          <FormField label={t.practitioner.dob} error={errors.dob?.message}>
            <Controller
              control={control}
              name="dob"
              render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} withDropdown />
              )}
            />
          </FormField>
          <FormField label={t.practitioner.phone} error={errors.phone?.message}>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <PhoneInputField
                  value={field.value || ''}
                  onChange={(v) => field.onChange(v || '')}
                  disabled={pending}
                />
              )}
            />
          </FormField>
          <FormField label={t.practitioner.whatsapp} error={errors.whatsapp?.message}>
            <Controller
              control={control}
              name="whatsapp"
              render={({ field }) => (
                <PhoneInputField
                  value={field.value || ''}
                  onChange={(v) => field.onChange(v || '')}
                  disabled={pending}
                />
              )}
            />
          </FormField>
          <FormField label={t.practitioner.languages} error={errors.languages?.message} className="sm:col-span-2">
            <Controller
              control={control}
              name="languages"
              render={({ field }) => (
                <MultiSelect
                  options={getPractitionerLanguages(t).map((l) => ({
                    value: l.value,
                    label: l.label,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t.practitioner.selectLanguages}
                  emptyText={t.practitioner.noLanguages}
                  disabled={pending}
                />
              )}
            />
          </FormField>
          <FormField label={t.practitioner.yearsOfPractice} error={errors.experienceYears?.message}>
            <Input type="number" min={0} max={80} {...register('experienceYears')} />
          </FormField>
          <FormField label={t.practitioner.licenseNumber} error={errors.licenseNumber?.message}>
            <Input {...register('licenseNumber')} />
          </FormField>
          <FormField label={t.practitioner.licenseExpiry} error={errors.licenseExpiry?.message}>
            <Controller
              control={control}
              name="licenseExpiry"
              render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} />}
            />
          </FormField>
          <FormField label={t.common.gender} error={errors.gender?.message}>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select
                  value={field.value || FORM_NONE}
                  onValueChange={(v) => field.onChange(v === FORM_NONE ? '' : v)}
                  disabled={pending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.common.selectGender} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FORM_NONE}>{t.common.notSpecified}</SelectItem>
                    {getGenders(t).map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField label={t.practitioner.bio} error={errors.bio?.message} className="sm:col-span-2">
            <Textarea rows={3} {...register('bio')} />
          </FormField>
          <FormField label={t.practitioner.bioAr} error={errors.bioAr?.message} className="sm:col-span-2">
            <Textarea rows={3} dir="rtl" {...register('bioAr')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t.practitioner.department}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={t.practitioner.department} required error={errors.departmentId?.message}>
            <Controller
              control={control}
              name="departmentId"
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={(v) => {
                    field.onChange(v);
                    setValue('defaultRoomId', '');
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.practitioner.selectDepartment} />
                  </SelectTrigger>
                  <SelectContent>
                    {(departments ?? [])
                      .filter((d) => d.isActive)
                      .map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {getBilingualName(d.name, d.nameAr, lang)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label={t.practitioner.defaultRoom} error={errors.defaultRoomId?.message}>
            <Controller
              control={control}
              name="defaultRoomId"
              render={({ field }) => (
                <Select
                  value={field.value || FORM_NONE}
                  onValueChange={(v) => field.onChange(v === FORM_NONE ? '' : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.practitioner.noDefaultRoom} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FORM_NONE}>{t.practitioner.noDefaultRoom}</SelectItem>
                    {roomOptions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {getBilingualName(r.name, r.nameAr, lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField label={t.practitioner.employment} error={errors.employmentType?.message}>
            <Controller
              control={control}
              name="employmentType"
              render={({ field }) => (
                <Select
                  value={field.value || FORM_NONE}
                  onValueChange={(v) => {
                    const next = v === FORM_NONE ? '' : v;
                    field.onChange(next);
                    if (next !== 'commission' && next !== 'mixed') {
                      setValue('commissionPercent', '', { shouldValidate: true });
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.common.notSpecified} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FORM_NONE}>{t.common.notSpecified}</SelectItem>
                    <SelectItem value="salaried">{t.constants.employment.salaried}</SelectItem>
                    <SelectItem value="commission">{t.constants.employment.commission}</SelectItem>
                    <SelectItem value="mixed">{t.constants.employment.mixed}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          {needsCommission ? (
            <FormField label={t.practitioner.commissionPercent} required error={errors.commissionPercent?.message}>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder={t.practitioner.commissionPercentPlaceholder}
                {...register('commissionPercent')}
              />
            </FormField>
          ) : null}

          <FormField label={`${t.practitioner.buffer} (${t.common.minsCompact})`} required error={errors.bufferMins?.message}>
            <Input type="number" min={0} max={240} {...register('bufferMins')} />
          </FormField>

          <FormField label={t.practitioner.services} error={errors.serviceIds?.message} className="sm:col-span-2">
            <Controller
              control={control}
              name="serviceIds"
              render={({ field }) => (
                <MultiSelect
                  options={serviceOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t.practitioner.selectServices}
                  emptyText={t.practitioner.noActiveServices}
                />
              )}
            />
          </FormField>
        </CardContent>
      </Card>

      <WeeklyAvailabilityFields
        control={control}
        errors={errors}
        fields={availabilities.fields}
        onAdd={() =>
          availabilities.append({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' })
        }
        onRemove={(index) => void removeAvailability(index)}
      />

      <LeaveBlocksFields
        control={control}
        register={register}
        errors={errors}
        fields={timeOffs.fields}
        onAdd={() => timeOffs.append({ startDate: '', endDate: '', reason: '' })}
        onRemove={(index) => void removeTimeOff(index)}
      />

      <FormActions
        onCancel={onCancel}
        submitLabel={isEdit ? t.common.saveChanges : t.practitioner.addPractitioner}
        pending={pending}
      />
    </form>
  );
}
