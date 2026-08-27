'use client';

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Input, SelectItem } from '@/components/ui';
import { FormField } from '@/components/primitives';
import { IconInPerson, IconOnline } from '@/constants/icons';
import type { AppointmentFormData } from '@/lib/validations';
import type { Room } from '@/services/rooms.service';
import type { ServiceItem } from '@/services/services.service';
import { ChoiceButton, FormSection, OptionalSelect } from './appointment-form-controls';

export function AppointmentSessionFields({
  control,
  errors,
  register,
  sessionType,
  selectedService,
  rooms,
}: {
  control: Control<AppointmentFormData>;
  errors: FieldErrors<AppointmentFormData>;
  register: UseFormRegister<AppointmentFormData>;
  sessionType: AppointmentFormData['sessionType'];
  selectedService: ServiceItem | undefined;
  rooms: Room[] | undefined;
}) {
  const modes = selectedService?.supportedModes;
  const canInPerson = !modes || modes.includes('in_person');
  const canOnline = !modes || modes.includes('online');

  return (
    <FormSection title="Session Type" contentClassName="space-y-4">
      <Controller
        control={control}
        name="sessionType"
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-2">
            <ChoiceButton
              active={field.value === 'in_person'}
              disabled={!canInPerson}
              icon={<IconInPerson className="size-4" />}
              label="In Person"
              onClick={() => field.onChange('in_person')}
            />
            <ChoiceButton
              active={field.value === 'online'}
              disabled={!canOnline}
              icon={<IconOnline className="size-4" />}
              label="Online"
              onClick={() => field.onChange('online')}
            />
          </div>
        )}
      />

      {sessionType === 'in_person' ? (
        <FormField label="Room" required error={errors.roomId?.message}>
          <Controller
            control={control}
            name="roomId"
            render={({ field }) => (
              <OptionalSelect
                value={field.value}
                onChange={field.onChange}
                placeholder="Select a room"
              >
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </OptionalSelect>
            )}
          />
        </FormField>
      ) : (
        <FormField label="Meeting Link" required error={errors.meetingUrl?.message}>
          <Input
            type="url"
            inputMode="url"
            placeholder="https://meet.example.com/room"
            {...register('meetingUrl')}
          />
        </FormField>
      )}
    </FormSection>
  );
}
