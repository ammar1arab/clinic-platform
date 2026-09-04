'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { Badge, Input, Textarea } from '@/components/ui';
import { DatePicker, FormField, TimePicker } from '@/components/primitives';
import { IconInPerson, IconOnline, IconTimer } from '@/constants/icons';
import type { AppointmentFormData } from '@/lib/validations';
import { formatWaitingMins } from '@/lib/waiting-time';
import { useLanguage } from '@/providers';
import type { AppointmentStatus } from '@/services/appointments.service';
import type { Room } from '@/services/rooms.service';
import type { ServiceItem } from '@/services/services.service';
import { StatusFieldPicker } from '../shared/status-menu';
import { ChoiceButton, FormSection, OptionalSelect } from './appointment-form-controls';

export function AppointmentScheduleFields() {
  const { t } = useLanguage();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<AppointmentFormData>();

  return (
    <FormSection
      title={t.appointments.schedule}
      contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      <FormField label={t.appointments.dateLabel} required error={errors.date?.message}>
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DatePicker
              value={field.value}
              onChange={field.onChange}
              placeholder={t.common.pickDate}
              className="h-10"
            />
          )}
        />
      </FormField>
      <FormField label={t.appointments.timeLabel} required error={errors.time?.message}>
        <Controller
          control={control}
          name="time"
          render={({ field }) => (
            <TimePicker
              value={field.value}
              onChange={field.onChange}
              placeholder={t.common.selectTime}
              className="h-10"
              step={5}
            />
          )}
        />
      </FormField>
      <FormField
        label={t.appointments.durationMinutes}
        required
        error={errors.durationMins?.message}
      >
        <Input
          className="h-10"
          type="number"
          min={5}
          step={5}
          {...register('durationMins')}
        />
      </FormField>
    </FormSection>
  );
}

export function AppointmentSessionFields({
  sessionType,
  selectedService,
  rooms,
}: {
  sessionType: AppointmentFormData['sessionType'];
  selectedService: ServiceItem | undefined;
  rooms: Room[] | undefined;
}) {
  const { t, lang } = useLanguage();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<AppointmentFormData>();
  const modes = selectedService?.supportedModes;
  const canInPerson = !modes || modes.includes('in_person');
  const canOnline = !modes || modes.includes('online');

  return (
    <FormSection title={t.appointments.sessionType} contentClassName="space-y-4">
      <Controller
        control={control}
        name="sessionType"
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-2">
            <ChoiceButton
              active={field.value === 'in_person'}
              disabled={!canInPerson}
              icon={<IconInPerson className="size-4" />}
              label={t.appointments.inPerson}
              onClick={() => field.onChange('in_person')}
            />
            <ChoiceButton
              active={field.value === 'online'}
              disabled={!canOnline}
              icon={<IconOnline className="size-4" />}
              label={t.appointments.online}
              onClick={() => field.onChange('online')}
            />
          </div>
        )}
      />

      {sessionType === 'in_person' ? (
        <FormField label={t.appointments.room} required error={errors.roomId?.message}>
          <Controller
            control={control}
            name="roomId"
            render={({ field }) => (
              <OptionalSelect
                value={field.value}
                onChange={field.onChange}
                placeholder={t.appointments.selectRoom}
                searchPlaceholder={t.appointments.searchRooms}
                options={(rooms ?? []).map((room) => ({
                  value: room.id,
                  label: (lang === 'ar' && room.nameAr) || room.name,
                }))}
              />
            )}
          />
        </FormField>
      ) : (
        <FormField
          label={t.appointments.meetingLink}
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

export function AppointmentStatusFields({
  status,
  cancelReason,
  waitingMins,
  onStatusChange,
  onCancelReasonChange,
}: {
  status: AppointmentStatus;
  cancelReason: string;
  waitingMins: number | null;
  onStatusChange: (status: AppointmentStatus) => void;
  onCancelReasonChange: (reason: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <FormSection title={t.appointments.status}>
      <div className="space-y-3">
        <StatusFieldPicker status={status} onChange={onStatusChange} />
        {waitingMins != null ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t.appointments.waitingTime}
            </span>
            <Badge variant="warning" className="tabular-nums">
              <IconTimer className="size-3" />
              {formatWaitingMins(waitingMins, false, t)}
            </Badge>
          </div>
        ) : null}
        {status === 'cancelled' ? (
          <FormField
            label={t.appointments.cancellationReason}
            required
            labelClassName="text-destructive"
          >
            <Textarea
              value={cancelReason}
              onChange={(event) => onCancelReasonChange(event.target.value)}
              placeholder={t.appointments.requiredWhenCancelling}
              rows={2}
              className="resize-none border-destructive/40"
            />
          </FormField>
        ) : null}
      </div>
    </FormSection>
  );
}

export function AppointmentNotesFields() {
  const { t } = useLanguage();
  const {
    register,
    formState: { errors },
  } = useFormContext<AppointmentFormData>();

  return (
    <FormSection title={t.appointments.notes}>
      <FormField error={errors.notes?.message}>
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
