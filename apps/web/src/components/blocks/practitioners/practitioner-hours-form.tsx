'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormActions } from '@/components/primitives';
import { toDateParam } from '@/lib/datetime';
import { practitionerHoursSchema, type PractitionerHoursData } from '@/lib/validations';
import { useUpdatePractitioner } from '@/hooks/api/use-practitioners';
import { useConfirm, useLanguage } from '@/providers';
import type { PractitionerDetail } from '@/services/practitioners.service';
import { AvailabilityStudio } from './availability-studio';
import { toHoursFormValues, toHoursPayload } from './practitioner-form.mapper';

export function PractitionerHoursForm({
  clinicId,
  practitioner,
  onCancel,
  onSuccess,
}: {
  clinicId: string;
  practitioner: PractitionerDetail;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const confirm = useConfirm();
  const { t } = useLanguage();
  const updateMutation = useUpdatePractitioner(clinicId);
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PractitionerHoursData>({
    resolver: zodResolver(practitionerHoursSchema) as never,
    defaultValues: toHoursFormValues(practitioner),
  });

  const availabilities = useFieldArray({ control, name: 'availabilities' });
  const timeOffs = useFieldArray({ control, name: 'timeOffs' });
  const availabilityOverrides = useFieldArray({ control, name: 'availabilityOverrides' });
  const values = watch();

  const removeAvailability = async (index: number) => {
    const ok = await confirm({
      title: t.practitioner.removeAvailabilityTitle,
      description: t.practitioner.removeAvailabilityDesc,
      confirmLabel: t.common.remove,
      variant: 'destructive',
    });
    if (ok) availabilities.remove(index);
    return ok;
  };

  const removeTimeOff = async (index: number) => {
    const ok = await confirm({
      title: t.practitioner.removeLeaveTitle,
      description: t.practitioner.removeLeaveDesc,
      confirmLabel: t.common.remove,
      variant: 'destructive',
    });
    if (ok) timeOffs.remove(index);
    return ok;
  };

  return (
    <form
      onSubmit={handleSubmit((data) => {
        updateMutation.mutate(
          { id: practitioner.id, data: toHoursPayload(data) },
          { onSuccess },
        );
      })}
      className="min-w-0 space-y-4"
      noValidate
    >
      <AvailabilityStudio
        control={control}
        register={register}
        setValue={setValue}
        values={values}
        errors={errors}
        overrideFields={availabilityOverrides.fields}
        leaveFields={timeOffs.fields}
        onAddAvailability={(slot) => availabilities.append(slot)}
        onRemoveAvailability={removeAvailability}
        onAddOverride={() => {
          const day = toDateParam(new Date());
          availabilityOverrides.append({ startAt: `${day}T09:00`, endAt: `${day}T17:00`, reason: '' });
        }}
        onRemoveOverride={(index) => availabilityOverrides.remove(index)}
        onAddLeave={() => {
          const day = toDateParam(new Date());
          timeOffs.append({ startDate: day, endDate: day, reason: '' });
        }}
        onRemoveLeave={removeTimeOff}
      />
      <FormActions
        onCancel={onCancel}
        submitLabel={t.common.saveChanges}
        pending={updateMutation.isPending}
      />
    </form>
  );
}
