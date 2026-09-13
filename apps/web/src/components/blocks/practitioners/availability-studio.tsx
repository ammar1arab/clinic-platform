'use client';

import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { type EventResizeDoneArg } from '@fullcalendar/interaction';
import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import arLocale from '@fullcalendar/core/locales/ar';
import { addDays, startOfWeek } from 'date-fns';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui';
import { DatePicker, FormField, MetaStat, TimePicker } from '@/components/primitives';
import { popoverAnchorFromElement } from '@/components/blocks/appointments/schedule/appointment-popovers';
import { IconCalendar, IconDelete } from '@/constants/icons';
import { WEEKDAY_OPTIONS } from '@/constants/practitioner';
import { useIsMobile } from '@/hooks/shared/use-media-query';
import { keepNestedPortals } from '@/lib/overlay';
import { toDateParam } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import type { PractitionerFormData } from '@/lib/validations';
import { useLanguage } from '@/providers';
import {
  Controller,
  type Control,
  type FieldArrayWithId,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { AvailabilityOverridesFields, LeaveBlocksFields } from './practitioner-schedule-fields';

type AvailabilitySlot = PractitionerFormData['availabilities'][number];
const CALENDAR_PLUGINS = [timeGridPlugin, interactionPlugin];

function timeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function minutesBetween(startTime: string, endTime: string) {
  const [startHour = 0, startMinute = 0] = startTime.split(':').map(Number);
  const [endHour = 0, endMinute = 0] = endTime.split(':').map(Number);
  return Math.max(0, endHour * 60 + endMinute - startHour * 60 - startMinute);
}

function LiveAnchor({ element }: { element: Element }) {
  const virtualRef = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () =>
          element.isConnected ? element.getBoundingClientRect() : new DOMRect(),
      },
    }),
    [element],
  );
  return <PopoverAnchor virtualRef={virtualRef} />;
}

export function AvailabilityStudio({
  control,
  register,
  setValue,
  values,
  errors,
  overrideFields,
  leaveFields,
  onAddAvailability,
  onRemoveAvailability,
  onAddOverride,
  onRemoveOverride,
  onAddLeave,
  onRemoveLeave,
}: {
  control: Control<PractitionerFormData>;
  register: UseFormRegister<PractitionerFormData>;
  setValue: UseFormSetValue<PractitionerFormData>;
  values: PractitionerFormData;
  errors: FieldErrors<PractitionerFormData>;
  overrideFields: FieldArrayWithId<PractitionerFormData, 'availabilityOverrides'>[];
  leaveFields: FieldArrayWithId<PractitionerFormData, 'timeOffs'>[];
  onAddAvailability: (slot: AvailabilitySlot) => void;
  onRemoveAvailability: (index: number) => void | Promise<boolean | void>;
  onAddOverride: () => void;
  onRemoveOverride: (index: number) => void;
  onAddLeave: () => void;
  onRemoveLeave: (index: number) => void | Promise<boolean | void>;
}) {
  const { t, lang } = useLanguage();
  const isMobile = useIsMobile();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [anchor, setAnchor] = useState<Element | null>(null);
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 0 }), []);
  const events = useMemo(
    () =>
      values.availabilities.map((slot, index) => ({
        id: String(index),
        title: t.practitioner.weeklyAvailability,
        start: `${toDateParam(addDays(weekStart, slot.dayOfWeek))}T${slot.startTime}`,
        end: `${toDateParam(addDays(weekStart, slot.dayOfWeek))}T${slot.endTime}`,
        backgroundColor: 'var(--color-primary)',
        borderColor: 'var(--color-primary)',
        textColor: 'var(--color-primary-foreground)',
      })),
    [t.practitioner.weeklyAvailability, values.availabilities, weekStart],
  );

  const workingDays = new Set(values.availabilities.map((slot) => slot.dayOfWeek));
  const weeklyHours =
    Math.round(
      (values.availabilities.reduce(
        (total, slot) => total + minutesBetween(slot.startTime, slot.endTime),
        0,
      ) /
        60) *
        10,
    ) / 10;

  const updateSlotFromEvent = (index: number, start: Date | null, end: Date | null) => {
    if (!start || !end) return;
    setValue(`availabilities.${index}.dayOfWeek`, start.getDay(), { shouldDirty: true });
    setValue(`availabilities.${index}.startTime`, timeValue(start), { shouldDirty: true });
    setValue(`availabilities.${index}.endTime`, timeValue(end), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const closeSlot = () => {
    setSelectedSlot(null);
    setAnchor(null);
  };

  const handleSelect = (selection: DateSelectArg) => {
    onAddAvailability({
      dayOfWeek: selection.start.getDay(),
      startTime: timeValue(selection.start),
      endTime: timeValue(selection.end),
      effectiveFrom: '',
      effectiveUntil: '',
    });
    selection.view.calendar.unselect();
    closeSlot();
  };

  const handleEventMove = (event: EventDropArg | EventResizeDoneArg) => {
    updateSlotFromEvent(Number(event.event.id), event.event.start, event.event.end);
  };

  const activeSlot = selectedSlot === null ? undefined : values.availabilities[selectedSlot];
  const slotOpen = selectedSlot !== null && Boolean(activeSlot) && Boolean(anchor?.isConnected);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <IconCalendar className="size-4 text-primary" />
            {t.practitioner.weeklyAvailability}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t.practitioner.dragToAddAvailability}</p>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <MetaStat label={t.practitioner.workingDays} value={String(workingDays.size)} />
            <MetaStat label={t.practitioner.weeklyHours} value={String(weeklyHours)} />
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {WEEKDAY_OPTIONS.map((label, day) => (
              <span
                key={label}
                className={cn(
                  'rounded-md px-2 py-1 text-xs font-medium',
                  workingDays.has(day)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {t.constants.weekdays[label]}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div
            data-schedule-host=""
            className="h-128 min-h-112 overflow-hidden [&_.fc]:h-full [&_.fc]:text-sm [&_.fc-view-harness]:min-h-0"
          >
            <FullCalendar
              key={`${lang}-${isMobile ? 'day' : 'week'}`}
              plugins={CALENDAR_PLUGINS}
              initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
              initialDate={weekStart}
              locales={[arLocale]}
              locale={lang === 'ar' ? 'ar' : 'en'}
              direction={lang === 'ar' ? 'rtl' : 'ltr'}
              headerToolbar={{ left: 'prev,next', center: 'title', right: '' }}
              height="100%"
              allDaySlot={false}
              slotMinTime="06:00:00"
              slotMaxTime="23:00:00"
              slotDuration="00:15:00"
              snapDuration="00:15:00"
              selectable
              selectMirror
              editable
              eventDurationEditable
              eventResizableFromStart
              events={events}
              select={handleSelect}
              eventClick={(event: EventClickArg) => {
                setSelectedSlot(Number(event.event.id));
                setAnchor(popoverAnchorFromElement(event.el));
              }}
              eventDrop={handleEventMove}
              eventResize={handleEventMove}
              nowIndicator
              expandRows
              stickyHeaderDates
            />
          </div>
        </CardContent>
      </Card>

      {slotOpen && anchor && selectedSlot !== null && activeSlot ? (
        <Popover open onOpenChange={(open) => !open && closeSlot()}>
          <LiveAnchor element={anchor} />
          <PopoverContent
            onInteractOutside={keepNestedPortals}
            className="w-[min(calc(100vw-2rem),20rem)] space-y-4 p-3"
          >
            <div>
              <p className="font-heading text-sm font-semibold">{t.practitioner.selectedAvailability}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t.constants.weekdays[WEEKDAY_OPTIONS[activeSlot.dayOfWeek]]}
              </p>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <Controller
                control={control}
                name={`availabilities.${selectedSlot}.startTime`}
                render={({ field }) => <TimePicker value={field.value} onChange={field.onChange} />}
              />
              <span aria-hidden className="text-muted-foreground">
                -
              </span>
              <Controller
                control={control}
                name={`availabilities.${selectedSlot}.endTime`}
                render={({ field }) => <TimePicker value={field.value} onChange={field.onChange} />}
              />
            </div>
            <div className="space-y-2 rounded-xl bg-muted/40 p-3">
              <p className="text-sm font-medium">{t.practitioner.repeatSchedule}</p>
              <p className="text-xs text-muted-foreground">{t.practitioner.repeatScheduleDesc}</p>
              <div className="grid grid-cols-1 gap-2">
                <DateController
                  control={control}
                  name={`availabilities.${selectedSlot}.effectiveFrom`}
                  label={t.common.from}
                />
                <DateController
                  control={control}
                  name={`availabilities.${selectedSlot}.effectiveUntil`}
                  label={t.common.to}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setValue(`availabilities.${selectedSlot}.effectiveFrom`, toDateParam(weekStart), {
                    shouldDirty: true,
                  });
                  setValue(
                    `availabilities.${selectedSlot}.effectiveUntil`,
                    toDateParam(addDays(weekStart, 6)),
                    { shouldDirty: true },
                  );
                }}
              >
                {t.practitioner.thisWeekOnly}
              </Button>
            </div>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={async () => {
                const removed = await onRemoveAvailability(selectedSlot);
                if (removed !== false) closeSlot();
              }}
            >
              <IconDelete />
              {t.common.remove}
            </Button>
          </PopoverContent>
        </Popover>
      ) : null}

      <AvailabilityOverridesFields
        control={control}
        register={register}
        errors={errors}
        fields={overrideFields}
        onAdd={onAddOverride}
        onRemove={onRemoveOverride}
      />
      <LeaveBlocksFields
        control={control}
        register={register}
        errors={errors}
        fields={leaveFields}
        onAdd={onAddLeave}
        onRemove={onRemoveLeave}
      />
    </div>
  );
}

function DateController({
  control,
  name,
  label,
}: {
  control: Control<PractitionerFormData>;
  name: `availabilities.${number}.effectiveFrom` | `availabilities.${number}.effectiveUntil`;
  label: string;
}) {
  return (
    <FormField label={label} className="min-w-0">
      <Controller
        control={control}
        name={name}
        render={({ field }) => <DatePicker value={field.value ?? ''} onChange={field.onChange} />}
      />
    </FormField>
  );
}
