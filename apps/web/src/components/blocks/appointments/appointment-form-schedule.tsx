'use client';

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui';
import { DatePicker, FormField, TimePicker } from '@/components/primitives';
import type { AppointmentFormData } from '@/lib/validations';
import { FormSection } from './appointment-form-controls';

export function AppointmentScheduleFields({
  control,
  errors,
  register,
}: {
  control: Control<AppointmentFormData>;
  errors: FieldErrors<AppointmentFormData>;
  register: UseFormRegister<AppointmentFormData>;
}) {
  return (
    <FormSection title="Schedule" contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <FormField label="Date" required error={errors.date?.message}>
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DatePicker
              value={field.value}
              onChange={field.onChange}
              placeholder="Pick a date"
              className="h-10"
            />
          )}
        />
      </FormField>
      <FormField label="Time" required error={errors.time?.message}>
        <Controller
          control={control}
          name="time"
          render={({ field }) => (
            <TimePicker
              value={field.value}
              onChange={field.onChange}
              placeholder="Pick a time"
              className="h-10"
              step={5}
            />
          )}
        />
      </FormField>
      <FormField label="Duration (min)" required error={errors.durationMins?.message}>
        <Input className="h-10" type="number" min={5} step={5} {...register('durationMins')} />
      </FormField>
    </FormSection>
  );
}
