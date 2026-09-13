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
import { DatePicker, FormField, TimePicker } from '@/components/primitives';
import { popoverAnchorFromElement } from '@/components/blocks/appointments/schedule/appointment-popovers';
import { IconDelete } from '@/constants/icons';
import { WEEKDAY_OPTIONS } from '@/constants/practitioner';
import { keepNestedPortals } from '@/lib/overlay';
import { formatTimeRange, parseClock, toClockValue, toDateParam } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import type { PractitionerHoursData } from '@/lib/validations';
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

type AvailabilitySlot = PractitionerHoursData['availabilities'][number];
const CALENDAR_PLUGINS = [timeGridPlugin, interactionPlugin];

function timeValue(date: Date) {
  return toClockValue(date.getHours(), date.getMinutes());
}

function minutesBetween(startTime: string, endTime: string) {
  const start = parseClock(startTime);
  const end = parseClock(endTime);
  if (!start || !end) return 0;
  return Math.max(0, end.hours * 60 + end.minutes - (start.hours * 60 + start.minutes));
}

function clockToFc(minutes: number) {
  const clamped = Math.min(23 * 60, Math.max(0, minutes));
  return `${toClockValue(Math.floor(clamped / 60), clamped % 60)}:00`;
}

function visibleDayWindow(slots: AvailabilitySlot[]) {
  if (!slots.length) return { min: '08:00:00', max: '18:00:00' };
  let minM = 8 * 60;
  let maxM = 18 * 60;
  for (const slot of slots) {
    const start = parseClock(slot.startTime);
    const end = parseClock(slot.endTime);
    if (start) minM = Math.min(minM, start.hours * 60 + start.minutes - 30);
    if (end) maxM = Math.max(maxM, end.hours * 60 + end.minutes + 30);
  }
  return {
    min: clockToFc(Math.max(6 * 60, minM)),
    max: clockToFc(Math.min(23 * 60, Math.max(maxM, minM + 60))),
  };
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
  control: Control<PractitionerHoursData>;
  register: UseFormRegister<PractitionerHoursData>;
  setValue: UseFormSetValue<PractitionerHoursData>;
  values: PractitionerHoursData;
  errors: FieldErrors<PractitionerHoursData>;
  overrideFields: FieldArrayWithId<PractitionerHoursData, 'availabilityOverrides'>[];
  leaveFields: FieldArrayWithId<PractitionerHoursData, 'timeOffs'>[];
  onAddAvailability: (slot: AvailabilitySlot) => void;
  onRemoveAvailability: (index: number) => void | Promise<boolean | void>;
  onAddOverride: () => void;
  onRemoveOverride: (index: number) => void;
  onAddLeave: () => void;
  onRemoveLeave: (index: number) => void | Promise<boolean | void>;
}) {
  const { t, lang } = useLanguage();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [anchor, setAnchor] = useState<Element | null>(null);
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 0 }), []);
  const dayWindow = useMemo(
    () => visibleDayWindow(values.availabilities),
    [values.availabilities],
  );
  const events = useMemo(
    () =>
      values.availabilities.map((slot, index) => ({
        id: String(index),
        title: formatTimeRange(slot.startTime, slot.endTime, undefined, lang),
        start: `${toDateParam(addDays(weekStart, slot.dayOfWeek))}T${slot.startTime}`,
        end: `${toDateParam(addDays(weekStart, slot.dayOfWeek))}T${slot.endTime}`,
        backgroundColor: 'var(--color-primary)',
        borderColor: 'var(--color-primary)',
        textColor: 'var(--color-primary-foreground)',
      })),
    [lang, values.availabilities, weekStart],
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
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm">{t.practitioner.weeklyAvailability}</CardTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                {workingDays.size} {t.practitioner.workingDays}
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                {weeklyHours} {t.practitioner.weeklyHours}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_OPTIONS.map((label, day) => (
              <span
                key={label}
                className={cn(
                  'flex h-7 items-center justify-center rounded-md text-[11px] font-medium',
                  workingDays.has(day)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {t.constants.weekdaysShort[label]}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div
            data-hours-calendar=""
            data-schedule-host=""
            className="[&_.fc]:text-xs"
          >
            <FullCalendar
              key={`${lang}-${dayWindow.min}-${dayWindow.max}`}
              plugins={CALENDAR_PLUGINS}
              initialView="timeGridWeek"
              initialDate={weekStart}
              locales={[arLocale]}
              locale={lang === 'ar' ? 'ar' : 'en'}
              direction={lang === 'ar' ? 'rtl' : 'ltr'}
              headerToolbar={false}
              dayHeaderFormat={{ weekday: 'short' }}
              height="auto"
              contentHeight="auto"
              allDaySlot={false}
              slotMinTime={dayWindow.min}
              slotMaxTime={dayWindow.max}
              slotDuration="01:00:00"
              slotLabelInterval="01:00:00"
              snapDuration="00:15:00"
              displayEventTime={false}
              eventContent={(arg) => ({
                html: `<div class="hours-event-label">${arg.event.title}</div>`,
              })}
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
  control: Control<PractitionerHoursData>;
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
