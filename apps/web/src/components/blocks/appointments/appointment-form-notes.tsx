'use client';

import type { UseFormRegister } from 'react-hook-form';
import { Textarea } from '@/components/ui';
import { FormField } from '@/components/primitives';
import type { AppointmentFormData } from '@/lib/validations';
import { FormSection } from './appointment-form-controls';

export function AppointmentNotesFields({
  register,
  error,
}: {
  register: UseFormRegister<AppointmentFormData>;
  error?: string;
}) {
  return (
    <FormSection title="Notes">
      <FormField error={error}>
        <Textarea
          rows={3}
          maxLength={1000}
          placeholder="Optional notes..."
          className="resize-none"
          {...register('notes')}
        />
      </FormField>
    </FormSection>
  );
}
