'use client';

import { Controller, useFormContext } from 'react-hook-form';
import type { AppointmentPermission } from '@clinic/types';
import { Badge, Input, Textarea } from '@/components/ui';
import { DatePicker, FormField, ReadOnlyMark, TimePicker } from '@/components/primitives';
import { IconInPerson, IconOnline, IconTimer } from '@/constants/icons';
import type { AppointmentFormData } from '@/lib/validations';
import { formatWaitingMins } from '@/lib/waiting-time';
import { useLanguage } from '@/providers';
import type { AppointmentStatus } from '@/services/appointments.service';
import type { Room } from '@/services/rooms.service';
import type { ServiceItem } from '@/services/services.service';
import { StatusBadgeBlock } from '../shared/status-badge';
import { StatusFieldPicker } from '../shared/status-menu';
import { ChoiceButton, FormSection, LockedValue, OptionalSelect } from './appointment-form-controls';

export type AppointmentFieldAccess = Record<AppointmentPermission, boolean>;

export type AppointmentReadOnly = {
  patient: string;
  doctor: string;
  department: string;
  service: string;
  date: string;
  time: string;
  duration: string;
  session: string;
  placeLabel: string;
  place: string;
  notes: string;
};

export function AppointmentScheduleFields({
  locked = false,
  values,
}: {
  locked?: boolean;
  values?: Pick<AppointmentReadOnly, 'date' | 'time' | 'duration'>;
}) {
  const { t } = useLanguage();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<AppointmentFormData>();

  if (locked) {
    return (
      <FormSection
        title={t.appointments.schedule}
        action={<ReadOnlyMark label={t.common.readOnly} size="md" />}
        contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <LockedValue label={t.appointments.dateLabel} value={values?.date ?? ''} />
        <LockedValue label={t.appointments.timeLabel} value={values?.time ?? ''} />
        <LockedValue label={t.appointments.durationMinutes} value={values?.duration ?? ''} />
      </FormSection>
    );
  }

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
  locked = false,
  values,
}: {
  sessionType: AppointmentFormData['sessionType'];
  selectedService: ServiceItem | undefined;
  rooms: Room[] | undefined;
  locked?: boolean;
  values?: Pick<AppointmentReadOnly, 'session' | 'placeLabel' | 'place'>;
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

  if (locked) {
    return (
      <FormSection
        title={t.appointments.sessionType}
        action={<ReadOnlyMark label={t.common.readOnly} size="md" />}
        contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <LockedValue label={t.appointments.sessionType} value={values?.session ?? ''} />
        <LockedValue label={values?.placeLabel || t.appointments.room} value={values?.place ?? ''} />
      </FormSection>
    );
  }

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
  canEdit = true,
  onStatusChange,
  onCancelReasonChange,
}: {
  status: AppointmentStatus;
  cancelReason: string;
  waitingMins: number | null;
  canEdit?: boolean;
  onStatusChange: (status: AppointmentStatus) => void;
  onCancelReasonChange: (reason: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <FormSection
      title={t.appointments.status}
      action={canEdit ? undefined : <ReadOnlyMark label={t.common.readOnly} size="md" />}
    >
      <div className="space-y-3">
        {canEdit ? (
          <StatusFieldPicker status={status} onChange={onStatusChange} />
        ) : (
          <StatusBadgeBlock status={status} tip={false} />
        )}
        {waitingMins != null ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t.appointments.waitingTime}
            </span>
            <Badge variant="warning" className="tabular-nums">
              <IconTimer className="size-3" />
              {formatWaitingMins(waitingMins, t)}
            </Badge>
          </div>
        ) : null}
        {canEdit && status === 'cancelled' ? (
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

export function AppointmentNotesFields({
  locked = false,
  value = '',
}: {
  locked?: boolean;
  value?: string;
}) {
  const { t } = useLanguage();
  const {
    register,
    formState: { errors },
  } = useFormContext<AppointmentFormData>();

  if (locked) {
    return (
      <FormSection
        title={t.appointments.notes}
        action={<ReadOnlyMark label={t.common.readOnly} size="md" />}
      >
        <LockedValue label={t.appointments.notes} value={value} />
      </FormSection>
    );
  }

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
