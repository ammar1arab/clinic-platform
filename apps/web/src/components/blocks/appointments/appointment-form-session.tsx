'use client';

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui';
import { FormField } from '@/components/primitives';
import { IconInPerson, IconOnline } from '@/constants/icons';
import type { AppointmentFormData } from '@/lib/validations';
import type { Room } from '@/services/rooms.service';
import type { ServiceItem } from '@/services/services.service';
import { ChoiceButton, FormSection, OptionalSelect } from './appointment-form-controls';
import { useLanguage } from '@/providers';

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
  const { t, lang } = useLanguage();
  const modes = selectedService?.supportedModes;
  const canInPerson = !modes || modes.includes('in_person');
  const canOnline = !modes || modes.includes('online');

  return (
    <FormSection
      title={lang === 'ar' ? 'نوع الجلسة' : 'Session Type'}
      contentClassName="space-y-4"
    >
      <Controller
        control={control}
        name="sessionType"
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-2">
            <ChoiceButton
              active={field.value === 'in_person'}
              disabled={!canInPerson}
              icon={<IconInPerson className="size-4" />}
              label={t?.appointments?.inPerson ?? 'In Person'}
              onClick={() => field.onChange('in_person')}
            />
            <ChoiceButton
              active={field.value === 'online'}
              disabled={!canOnline}
              icon={<IconOnline className="size-4" />}
              label={t?.appointments?.online ?? 'Online'}
              onClick={() => field.onChange('online')}
            />
          </div>
        )}
      />

      {sessionType === 'in_person' ? (
        <FormField label={t?.appointments?.room ?? 'Room'} required error={errors.roomId?.message}>
          <Controller
            control={control}
            name="roomId"
            render={({ field }) => (
              <OptionalSelect
                value={field.value}
                onChange={field.onChange}
                placeholder={t?.appointments?.selectRoom ?? 'Select a room'}
                searchPlaceholder={lang === 'ar' ? 'البحث عن غرفة...' : 'Search rooms…'}
                options={(rooms ?? []).map((room) => ({
                  value: room.id,
                  label: room.name,
                }))}
              />
            )}
          />
        </FormField>
      ) : (
        <FormField
          label={t?.appointments?.meetingLink ?? 'Meeting Link'}
          required
          error={errors.meetingUrl?.message}
        >
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
