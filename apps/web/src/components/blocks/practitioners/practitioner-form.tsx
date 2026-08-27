'use client';

import { useMemo, useState } from 'react';
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
  TimePicker,
  MultiSelect,
  AvatarUpload,
} from '@/components/primitives';
import { FORM_NONE } from '@/constants/form';
import { PRACTITIONER_LANGUAGES, WEEKDAY_OPTIONS } from '@/constants/practitioner';
import { GENDERS } from '@/constants/patient';
import {
  practitionerSchema,
  type PractitionerFormData,
} from '@/lib/validations';
import {
  useCreatePractitioner,
  useUpdatePractitioner,
} from '@/hooks/api/use-practitioners';
import { useDepartments } from '@/hooks/api/use-departments';
import { useRooms } from '@/hooks/api/use-rooms';
import { useServices } from '@/hooks/api/use-services';
import { useConfirm } from '@/providers';
import type { PractitionerDetail } from '@/services/practitioners.service';
import {
  emptyPractitionerValues,
  toPractitionerFormValues,
  toPractitionerPayload,
} from './practitioner-form.mapper';
import { IconAdd, IconCopy, IconDelete } from '@/constants/icons';

type Props = {
  clinicId: string;
  practitioner?: PractitionerDetail;
  onCancel: () => void;
  onSuccess: (id: string) => void;
};

export function PractitionerForm({
  clinicId,
  practitioner,
  onCancel,
  onSuccess,
}: Props) {
  const isEdit = !!practitioner;
  const confirm = useConfirm();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [welcomeEmailSent, setWelcomeEmailSent] = useState(false);

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
  const needsCommission =
    employmentType === 'commission' || employmentType === 'mixed';

  const roomOptions = useMemo(() => {
    const list = (rooms ?? []).filter((r) => r.isActive);
    if (!departmentId) return list;
    return list.filter((r) => !r.departmentId || r.departmentId === departmentId);
  }, [rooms, departmentId]);

  const serviceOptions = useMemo(
    () =>
      (services ?? [])
        .filter((s) => s.isActive)
        .map((s) => ({ value: s.id, label: s.name })),
    [services],
  );

  const pending = createMutation.isPending || updateMutation.isPending;

  const removeAvailability = async (index: number) => {
    const ok = await confirm({
      title: 'Remove this availability?',
      description: 'This weekly slot will be dropped from the form until you save.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (ok) availabilities.remove(index);
  };

  const removeTimeOff = async (index: number) => {
    const ok = await confirm({
      title: 'Remove this leave block?',
      description: 'This blocked range will be dropped from the form until you save.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (ok) timeOffs.remove(index);
  };

  const onSubmit = (data: PractitionerFormData) => {
    if (!isEdit && !data.email?.trim()) {
      setError('email', { message: 'Email is required' });
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
        onSuccess: (res) => {
          setTempPassword(res.temporaryPassword);
          setCreatedId(res.practitioner.id);
          setWelcomeEmailSent(res.welcomeEmailSent);
          toast.message(
            res.welcomeEmailSent
              ? 'Welcome email sent. IconCopy the password as backup.'
              : 'IconCopy the temporary password - shown once only.',
          );
        },
      },
    );
  };

  if (tempPassword && createdId) {
    const email = watch('email');
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Practitioner created</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {welcomeEmailSent
              ? 'A welcome email was sent. Keep this password as a backup - they must change it on first login.'
              : 'Share login credentials once. Password is not shown again. They must change it on first login.'}
          </p>
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <p>
              <span className="text-muted-foreground">Email: </span>
              {email}
            </p>
            <p className="mt-2 flex items-center gap-2">
              <span className="text-muted-foreground">Password: </span>
              <code className="rounded-md bg-background px-1.5 py-0.5 font-mono">
                {tempPassword}
              </code>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={() => {
                  void navigator.clipboard.writeText(tempPassword);
                  toast.success('Copied');
                }}
              >
                <IconCopy className="size-3.5" />
              </Button>
            </p>
          </div>
          <Button type="button" onClick={() => onSuccess(createdId)}>
            View profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField error={errors.imageUrl?.message}>
            <AvatarUpload
              value={imageUrl}
              onChange={(url) =>
                setValue('imageUrl', url, { shouldValidate: true, shouldDirty: true })
              }
              fallbackLabel={name || 'DR'}
              disabled={pending}
              alt="Practitioner photo"
            />
          </FormField>

          <BilingualNameFields
            name={watch('name')}
            nameAr={watch('nameAr') ?? ''}
            onNameChange={(v) => setValue('name', v, { shouldValidate: true })}
            onNameArChange={(v) => setValue('nameAr', v, { shouldValidate: true })}
            englishError={errors.name?.message}
            arabicError={errors.nameAr?.message}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Title" error={errors.title?.message}>
              <Input placeholder="Dr, Consultant, Therapist…" {...register('title')} />
            </FormField>
            <FormField label="Nationality" error={errors.nationality?.message}>
              <Controller
                control={control}
                name="nationality"
                render={({ field }) => (
                  <CountrySelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select nationality"
                    disabled={pending}
                  />
                )}
              />
            </FormField>
            <FormField label="Specialty" error={errors.specialty?.message}>
              <Input placeholder="Dermatology, Orthodontics…" {...register('specialty')} />
            </FormField>
            <FormField label="Specialty (Arabic)" error={errors.specialtyAr?.message}>
              <Input
                dir="rtl"
                placeholder="التخصص"
                {...register('specialtyAr')}
              />
            </FormField>
            <FormField label="Email" required={!isEdit} error={errors.email?.message}>
              <Input type="email" disabled={isEdit} {...register('email')} />
            </FormField>
            <FormField label="Date of birth" error={errors.dob?.message}>
              <Controller
                control={control}
                name="dob"
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} withDropdown />
                )}
              />
            </FormField>
            <FormField label="Phone" error={errors.phone?.message}>
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
            <FormField label="WhatsApp" error={errors.whatsapp?.message}>
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
            <FormField label="Languages" error={errors.languages?.message} className="sm:col-span-2">
              <Controller
                control={control}
                name="languages"
                render={({ field }) => (
                  <MultiSelect
                    options={PRACTITIONER_LANGUAGES.map((l) => ({
                      value: l.value,
                      label: l.label,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select languages spoken"
                    emptyText="No languages"
                    disabled={pending}
                  />
                )}
              />
            </FormField>
            <FormField label="Years of practice" error={errors.experienceYears?.message}>
              <Input type="number" min={0} max={80} {...register('experienceYears')} />
            </FormField>
            <FormField label="License number" error={errors.licenseNumber?.message}>
              <Input {...register('licenseNumber')} />
            </FormField>
            <FormField label="License expiry" error={errors.licenseExpiry?.message}>
              <Controller
                control={control}
                name="licenseExpiry"
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} />
                )}
              />
            </FormField>
            <FormField label="Gender" error={errors.gender?.message}>
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
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FORM_NONE}>Not specified</SelectItem>
                      {GENDERS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="Bio" error={errors.bio?.message} className="sm:col-span-2">
              <Textarea rows={3} {...register('bio')} />
            </FormField>
            <FormField label="Bio (Arabic)" error={errors.bioAr?.message} className="sm:col-span-2">
              <Textarea rows={3} dir="rtl" {...register('bioAr')} />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Clinic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Department" required error={errors.departmentId?.message}>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {(departments ?? [])
                        .filter((d) => d.isActive)
                        .map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Default room" error={errors.defaultRoomId?.message}>
              <Controller
                control={control}
                name="defaultRoomId"
                render={({ field }) => (
                  <Select
                    value={field.value || FORM_NONE}
                    onValueChange={(v) => field.onChange(v === FORM_NONE ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No default room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FORM_NONE}>No default room</SelectItem>
                      {roomOptions.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField label="Employment" error={errors.employmentType?.message}>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FORM_NONE}>Not set</SelectItem>
                      <SelectItem value="salaried">Salaried</SelectItem>
                      <SelectItem value="commission">Commission</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            {needsCommission ? (
              <FormField
                label="Commission %"
                required
                error={errors.commissionPercent?.message}
              >
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  placeholder="e.g. 30"
                  {...register('commissionPercent')}
                />
              </FormField>
            ) : null}

            <FormField
              label="Buffer (mins)"
              required
              error={errors.bufferMins?.message}
            >
              <Input type="number" min={0} max={240} {...register('bufferMins')} />
            </FormField>
          </div>

          <FormField label="Services" error={errors.serviceIds?.message}>
            <Controller
              control={control}
              name="serviceIds"
              render={({ field }) => (
                <MultiSelect
                  options={serviceOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select services"
                  emptyText="No active services"
                />
              )}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Availability</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-primary"
            onClick={() =>
              availabilities.append({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' })
            }
          >
            <IconAdd className="size-3.5" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {availabilities.fields.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No weekly patterns
            </p>
          ) : (
            availabilities.fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-2 rounded-lg bg-muted/35 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <FormField label="Day">
                  <Controller
                    control={control}
                    name={`availabilities.${index}.dayOfWeek`}
                    render={({ field: f }) => (
                      <Select
                        value={String(f.value)}
                        onValueChange={(v) => f.onChange(Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WEEKDAY_OPTIONS.map((label, day) => (
                            <SelectItem key={label} value={String(day)}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
                <FormField label="Start" error={errors.availabilities?.[index]?.startTime?.message}>
                  <Controller
                    control={control}
                    name={`availabilities.${index}.startTime`}
                    render={({ field: f }) => (
                      <TimePicker value={f.value} onChange={f.onChange} />
                    )}
                  />
                </FormField>
                <FormField label="End" error={errors.availabilities?.[index]?.endTime?.message}>
                  <Controller
                    control={control}
                    name={`availabilities.${index}.endTime`}
                    render={({ field: f }) => (
                      <TimePicker value={f.value} onChange={f.onChange} />
                    )}
                  />
                </FormField>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => void removeAvailability(index)}
                  >
                    <IconDelete className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Leave</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-primary"
            onClick={() => timeOffs.append({ startDate: '', endDate: '', reason: '' })}
          >
            <IconAdd className="size-3.5" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {timeOffs.fields.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No leave blocks</p>
          ) : (
            timeOffs.fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-2 rounded-lg bg-muted/35 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <FormField label="Start" error={errors.timeOffs?.[index]?.startDate?.message}>
                  <Controller
                    control={control}
                    name={`timeOffs.${index}.startDate`}
                    render={({ field: f }) => (
                      <DatePicker value={f.value} onChange={f.onChange} />
                    )}
                  />
                </FormField>
                <FormField label="End" error={errors.timeOffs?.[index]?.endDate?.message}>
                  <Controller
                    control={control}
                    name={`timeOffs.${index}.endDate`}
                    render={({ field: f }) => (
                      <DatePicker value={f.value} onChange={f.onChange} />
                    )}
                  />
                </FormField>
                <FormField label="Reason">
                  <Input {...register(`timeOffs.${index}.reason`)} />
                </FormField>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => void removeTimeOff(index)}
                  >
                    <IconDelete className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <FormActions
        onCancel={onCancel}
        submitLabel={isEdit ? 'Save' : 'Create practitioner'}
        pending={pending}
      />
    </form>
  );
}
