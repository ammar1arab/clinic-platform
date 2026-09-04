'use client';

import type { UseFormRegister } from 'react-hook-form';
import { Textarea } from '@/components/ui';
import { FormField } from '@/components/primitives';
import type { AppointmentFormData } from '@/lib/validations';
import { FormSection } from './appointment-form-controls';
import { useLanguage } from '@/providers';

export function AppointmentNotesFields({
  register,
  error,
}: {
  register: UseFormRegister<AppointmentFormData>;
  error?: string;
}) {
  const { t } = useLanguage();

  return (
    <FormSection title={t.appointments.notes}>
      <FormField error={error}>
        <Textarea
          rows={3}
          maxLength={1000}
          placeholder={t.appointments.optionalNotes}
          className="resize-none"
          {...register('notes')}
        />
      </FormField>
    </FormSection>
  );
}
