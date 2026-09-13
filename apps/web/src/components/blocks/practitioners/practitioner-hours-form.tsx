'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormActions } from '@/components/primitives';
import { practitionerHoursSchema, type PractitionerHoursData } from '@/lib/validations';
import { useUpdatePractitioner } from '@/hooks/api/use-practitioners';
import { useLanguage } from '@/providers';
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
  const { t } = useLanguage();
  const updateMutation = useUpdatePractitioner(clinicId);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PractitionerHoursData>({
    resolver: zodResolver(practitionerHoursSchema) as never,
    defaultValues: toHoursFormValues(practitioner),
  });

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
        errors={errors}
      />
      <FormActions
        onCancel={onCancel}
        submitLabel={t.common.saveChanges}
        pending={updateMutation.isPending}
      />
    </form>
  );
}
