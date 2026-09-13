'use client';

import type { ReactNode } from 'react';
import {
  Controller,
  type Control,
  type FieldArrayWithId,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui';
import { DatePicker, EmptyState, FormField, IconWell, TimePicker } from '@/components/primitives';
import type { PractitionerFormData } from '@/lib/validations';
import {
  IconAdd,
  IconCalendarClock,
  IconDelete,
  type LucideIcon,
} from '@/constants/icons';
import { useLanguage } from '@/providers';

type LeaveField = FieldArrayWithId<PractitionerFormData, 'timeOffs'>;
type OverrideField = FieldArrayWithId<PractitionerFormData, 'availabilityOverrides'>;

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <IconAdd />
      {label}
    </Button>
  );
}

function ScheduleCard({
  title,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  addLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardAction>
          <AddButton label={addLabel} onClick={onAdd} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2.5">{children}</CardContent>
    </Card>
  );
}

function SlotRow({
  icon,
  heading,
  onRemove,
  removeLabel,
  children,
}: {
  icon: LucideIcon;
  heading?: ReactNode;
  onRemove: () => void;
  removeLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-muted/40 p-3">
      <div className="flex items-center gap-2">
        <IconWell icon={icon} size="sm" accent="muted" />
        <div className="min-w-0 flex-1">{heading}</div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label={removeLabel}
          onClick={onRemove}
        >
          <IconDelete />
        </Button>
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function splitDateTime(value: string) {
  const [date = '', timePart = ''] = value.split('T');
  return { date, time: timePart.slice(0, 5) };
}

function joinDateTime(date: string, time: string) {
  if (!date) return '';
  return `${date}T${time || '09:00'}`;
}

function DateTimeFields({
  value,
  onChange,
  dateError,
  dateLabel,
  timeLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  dateError?: string;
  dateLabel: string;
  timeLabel: string;
}) {
  const { date, time } = splitDateTime(value);
  return (
    <>
      <FormField label={dateLabel} error={dateError}>
        <DatePicker value={date} onChange={(next) => onChange(joinDateTime(next, time))} />
      </FormField>
      <FormField label={timeLabel}>
        <TimePicker value={time} onChange={(next) => onChange(joinDateTime(date, next))} />
      </FormField>
    </>
  );
}

export function AvailabilityOverridesFields({
  control,
  register,
  errors,
  fields,
  onAdd,
  onRemove,
}: {
  control: Control<PractitionerFormData>;
  register: UseFormRegister<PractitionerFormData>;
  errors: FieldErrors<PractitionerFormData>;
  fields: OverrideField[];
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  const { t } = useLanguage();
  return (
    <ScheduleCard title={t.practitioner.extraAvailability} addLabel={t.practitioner.addExtraAvailability} onAdd={onAdd}>
      {fields.length === 0 ? (
        <EmptyState icon={IconCalendarClock} title={t.practitioner.noExtraAvailability} description={t.practitioner.noExtraAvailabilityDesc} className="py-8" />
      ) : fields.map((field, index) => (
        <SlotRow key={field.id} icon={IconCalendarClock} removeLabel={t.common.remove} onRemove={() => onRemove(index)}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Controller
              control={control}
              name={`availabilityOverrides.${index}.startAt`}
              render={({ field: f }) => (
                <DateTimeFields
                  value={f.value}
                  onChange={f.onChange}
                  dateError={errors.availabilityOverrides?.[index]?.startAt?.message}
                  dateLabel={t.common.from}
                  timeLabel={t.common.selectTime}
                />
              )}
            />
            <Controller
              control={control}
              name={`availabilityOverrides.${index}.endAt`}
              render={({ field: f }) => (
                <DateTimeFields
                  value={f.value}
                  onChange={f.onChange}
                  dateError={errors.availabilityOverrides?.[index]?.endAt?.message}
                  dateLabel={t.common.to}
                  timeLabel={t.common.selectTime}
                />
              )}
            />
          </div>
          <FormField label={t.practitioner.leaveReason}>
            <Input placeholder={t.common.optional} {...register(`availabilityOverrides.${index}.reason`)} />
          </FormField>
        </SlotRow>
      ))}
    </ScheduleCard>
  );
}

export function LeaveBlocksFields({
  control,
  register,
  errors,
  fields,
  onAdd,
  onRemove,
}: {
  control: Control<PractitionerFormData>;
  register: UseFormRegister<PractitionerFormData>;
  errors: FieldErrors<PractitionerFormData>;
  fields: LeaveField[];
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  const { t } = useLanguage();
  return (
    <ScheduleCard
      title={t.practitioner.leave}
      addLabel={t.practitioner.addLeave}
      onAdd={onAdd}
    >
      {fields.length === 0 ? (
        <EmptyState
          icon={IconCalendarClock}
          title={t.practitioner.noLeaveBlocks}
          description={t.practitioner.noLeaveBlocksDesc}
          className="py-8"
        />
      ) : (
        fields.map((field, index) => (
          <SlotRow
            key={field.id}
            icon={IconCalendarClock}
            removeLabel={t.common.remove}
            onRemove={() => onRemove(index)}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label={t.common.from} error={errors.timeOffs?.[index]?.startDate?.message}>
                <Controller
                  control={control}
                  name={`timeOffs.${index}.startDate`}
                  render={({ field: f }) => <DatePicker value={f.value} onChange={f.onChange} />}
                />
              </FormField>
              <FormField label={t.common.to} error={errors.timeOffs?.[index]?.endDate?.message}>
                <Controller
                  control={control}
                  name={`timeOffs.${index}.endDate`}
                  render={({ field: f }) => <DatePicker value={f.value} onChange={f.onChange} />}
                />
              </FormField>
              <FormField label={t.practitioner.leaveReason} className="sm:col-span-2">
                <Input placeholder={t.common.optional} {...register(`timeOffs.${index}.reason`)} />
              </FormField>
            </div>
          </SlotRow>
        ))
      )}
    </ScheduleCard>
  );
}
