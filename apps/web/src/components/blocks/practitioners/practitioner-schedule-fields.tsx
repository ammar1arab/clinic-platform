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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { DatePicker, EmptyState, FormField, IconWell, TimePicker } from '@/components/primitives';
import { WEEKDAY_OPTIONS } from '@/constants/practitioner';
import type { PractitionerFormData } from '@/lib/validations';
import {
  IconAdd,
  IconCalendar,
  IconCalendarClock,
  IconDelete,
  type LucideIcon,
} from '@/constants/icons';
import { useLanguage } from '@/providers';

type WeeklyField = FieldArrayWithId<PractitionerFormData, 'availabilities'>;
type LeaveField = FieldArrayWithId<PractitionerFormData, 'timeOffs'>;

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

export function WeeklyAvailabilityFields({
  control,
  errors,
  fields,
  onAdd,
  onRemove,
}: {
  control: Control<PractitionerFormData>;
  errors: FieldErrors<PractitionerFormData>;
  fields: WeeklyField[];
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  const { t } = useLanguage();
  return (
    <ScheduleCard
      title={t.practitioner.weeklyAvailability}
      addLabel={t.practitioner.addDay}
      onAdd={onAdd}
    >
      {fields.length === 0 ? (
        <EmptyState
          icon={IconCalendar}
          title={t.practitioner.noWeeklyPatterns}
          description={t.practitioner.noWeeklyPatternsDesc}
          className="py-8"
        />
      ) : (
        fields.map((field, index) => (
          <SlotRow
            key={field.id}
            icon={IconCalendar}
            removeLabel={t.common.remove}
            onRemove={() => onRemove(index)}
            heading={
              <Controller
                control={control}
                name={`availabilities.${index}.dayOfWeek`}
                render={({ field: f }) => (
                  <Select value={String(f.value)} onValueChange={(v) => f.onChange(Number(v))}>
                    <SelectTrigger className="w-full" aria-label={t.practitioner.weeklyAvailability}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAY_OPTIONS.map((label, day) => (
                        <SelectItem key={label} value={String(day)}>
                          {t.constants.weekdays[label]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            }
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label={t.common.from} error={errors.availabilities?.[index]?.startTime?.message}>
                <Controller
                  control={control}
                  name={`availabilities.${index}.startTime`}
                  render={({ field: f }) => <TimePicker value={f.value} onChange={f.onChange} />}
                />
              </FormField>
              <FormField label={t.common.to} error={errors.availabilities?.[index]?.endTime?.message}>
                <Controller
                  control={control}
                  name={`availabilities.${index}.endTime`}
                  render={({ field: f }) => <TimePicker value={f.value} onChange={f.onChange} />}
                />
              </FormField>
            </div>
          </SlotRow>
        ))
      )}
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
