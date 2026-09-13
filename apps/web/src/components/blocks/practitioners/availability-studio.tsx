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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { DatePicker, FormField, TimePicker } from '@/components/primitives';
import { IconDelete } from '@/constants/icons';
import { WEEKDAY_OPTIONS } from '@/constants/practitioner';
import { useIsMobile } from '@/hooks/shared/use-media-query';
import { keepNestedPortals } from '@/lib/overlay';
import { formatTimeRange, parseClock, toClockValue, toDateParam } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import type { PractitionerHoursData } from '@/lib/validations';
import { useLanguage } from '@/providers';
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { AvailabilityOverridesFields, LeaveBlocksFields } from './practitioner-schedule-fields';
import { useHoursFields } from './use-hours-fields';

type AvailabilitySlot = PractitionerHoursData['availabilities'][number];
type SlotEditor =
  | { mode: 'create'; dayOfWeek: number; startTime: string; endTime: string }
  | { mode: 'edit'; index: number };

const CALENDAR_PLUGINS = [timeGridPlugin, interactionPlugin];
const DEFAULT_START = '09:00';
const DEFAULT_END = '17:00';

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

export function AvailabilityStudio<T extends PractitionerHoursData>({
  control,
  register,
  setValue,
  errors,
}: {
  control: Control<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  errors: FieldErrors<T>;
}) {
  const { t, lang } = useLanguage();
  const hoursControl = control as unknown as Control<PractitionerHoursData>;
  const hoursRegister = register as unknown as UseFormRegister<PractitionerHoursData>;
  const hoursSetValue = setValue as unknown as UseFormSetValue<PractitionerHoursData>;
  const hoursErrors = errors as FieldErrors<PractitionerHoursData>;
  const {
    values,
    overrideFields,
    leaveFields,
    onAddAvailability,
    onRemoveAvailability,
    onAddOverride,
    onRemoveOverride,
    onAddLeave,
    onRemoveLeave,
  } = useHoursFields(hoursControl);
  const isMobile = useIsMobile();
  const [editor, setEditor] = useState<SlotEditor | null>(null);
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
    hoursSetValue(`availabilities.${index}.dayOfWeek`, start.getDay(), { shouldDirty: true });
    hoursSetValue(`availabilities.${index}.startTime`, timeValue(start), { shouldDirty: true });
    hoursSetValue(`availabilities.${index}.endTime`, timeValue(end), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const closeSlot = () => setEditor(null);

  const openDay = (dayOfWeek: number) => {
    const index = values.availabilities.findIndex((slot) => slot.dayOfWeek === dayOfWeek);
    if (index >= 0) setEditor({ mode: 'edit', index });
    else {
      setEditor({
        mode: 'create',
        dayOfWeek,
        startTime: DEFAULT_START,
        endTime: DEFAULT_END,
      });
    }
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

  const handleDateClick = (click: { date: Date }) => {
    openDay(click.date.getDay());
  };

  const handleEventMove = (event: EventDropArg | EventResizeDoneArg) => {
    updateSlotFromEvent(Number(event.event.id), event.event.start, event.event.end);
  };

  const selectedIndex = editor?.mode === 'edit' ? editor.index : null;
  const activeSlot = selectedIndex === null ? undefined : values.availabilities[selectedIndex];
  const editorDay =
    editor?.mode === 'create'
      ? editor.dayOfWeek
      : activeSlot?.dayOfWeek;
  const editorOpen =
    editor?.mode === 'create' ||
    (editor?.mode === 'edit' && Boolean(activeSlot));
  const createValid =
    editor?.mode === 'create' && minutesBetween(editor.startTime, editor.endTime) > 0;

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
              <button
                key={label}
                type="button"
                onClick={() => openDay(day)}
                aria-label={`${t.practitioner.setWorkingHours} ${t.constants.weekdays[label]}`}
                aria-pressed={workingDays.has(day)}
                className={cn(
                  'flex h-9 items-center justify-center rounded-md text-[11px] font-medium',
                  'cursor-pointer transition-colors active:scale-95',
                  workingDays.has(day)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {t.constants.weekdaysShort[label]}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {isMobile ? t.practitioner.tapDayToSetHours : t.practitioner.dragToAddAvailability}
          </p>
        </CardHeader>
        <CardContent>
          <div
            data-hours-calendar=""
            data-schedule-host=""
            className="min-h-96 [&_.fc]:text-xs"
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
              slotDuration="00:30:00"
              slotLabelInterval="01:00:00"
              snapDuration="00:15:00"
              displayEventTime={false}
              eventContent={(arg) => ({
                html: `<div class="hours-event-label">${arg.event.title}</div>`,
              })}
              selectable={!isMobile}
              selectMirror={!isMobile}
              editable={!isMobile}
              eventDurationEditable={!isMobile}
              eventResizableFromStart={!isMobile}
              events={events}
              select={handleSelect}
              dateClick={isMobile ? handleDateClick : undefined}
              eventClick={(event: EventClickArg) => {
                setEditor({ mode: 'edit', index: Number(event.event.id) });
              }}
              eventDrop={handleEventMove}
              eventResize={handleEventMove}
              nowIndicator
              expandRows
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={editorOpen} onOpenChange={(open) => !open && closeSlot()}>
        <DialogContent
          preventClose={false}
          onInteractOutside={keepNestedPortals}
          className="gap-4"
        >
          <DialogHeader>
            <DialogTitle>
              {editor?.mode === 'create'
                ? t.practitioner.addWorkingHours
                : t.practitioner.setWorkingHours}
            </DialogTitle>
            <DialogDescription>
              {editorDay !== undefined
                ? t.constants.weekdays[WEEKDAY_OPTIONS[editorDay]]
                : t.practitioner.selectedAvailability}
            </DialogDescription>
          </DialogHeader>

          {editor?.mode === 'create' ? (
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <TimePicker
                value={editor.startTime}
                onChange={(startTime) => setEditor({ ...editor, startTime })}
                className="h-11"
              />
              <span aria-hidden className="text-muted-foreground">
                -
              </span>
              <TimePicker
                value={editor.endTime}
                onChange={(endTime) => setEditor({ ...editor, endTime })}
                className="h-11"
              />
            </div>
          ) : selectedIndex !== null && activeSlot ? (
            <>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <Controller
                  control={hoursControl}
                  name={`availabilities.${selectedIndex}.startTime`}
                  render={({ field }) => (
                    <TimePicker value={field.value} onChange={field.onChange} className="h-11" />
                  )}
                />
                <span aria-hidden className="text-muted-foreground">
                  -
                </span>
                <Controller
                  control={hoursControl}
                  name={`availabilities.${selectedIndex}.endTime`}
                  render={({ field }) => (
                    <TimePicker value={field.value} onChange={field.onChange} className="h-11" />
                  )}
                />
              </div>
              <div className="space-y-2 rounded-xl bg-muted/40 p-3">
                <p className="text-sm font-medium">{t.practitioner.repeatSchedule}</p>
                <p className="text-xs text-muted-foreground">{t.practitioner.repeatScheduleDesc}</p>
                <div className="grid grid-cols-1 gap-2">
                  <DateController
                    control={hoursControl}
                    name={`availabilities.${selectedIndex}.effectiveFrom`}
                    label={t.common.from}
                  />
                  <DateController
                    control={hoursControl}
                    name={`availabilities.${selectedIndex}.effectiveUntil`}
                    label={t.common.to}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    hoursSetValue(
                      `availabilities.${selectedIndex}.effectiveFrom`,
                      toDateParam(weekStart),
                      { shouldDirty: true },
                    );
                    hoursSetValue(
                      `availabilities.${selectedIndex}.effectiveUntil`,
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
                variant="outline"
                className="w-full"
                onClick={() =>
                  setEditor({
                    mode: 'create',
                    dayOfWeek: activeSlot.dayOfWeek,
                    startTime: DEFAULT_START,
                    endTime: DEFAULT_END,
                  })
                }
              >
                {t.practitioner.addAnotherHours}
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={async () => {
                  const removed = await onRemoveAvailability(selectedIndex);
                  if (removed !== false) closeSlot();
                }}
              >
                <IconDelete />
                {t.common.remove}
              </Button>
            </>
          ) : null}

          {editor?.mode === 'create' ? (
            <DialogFooter>
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={!createValid}
                onClick={() => {
                  if (editor.mode !== 'create' || !createValid) return;
                  onAddAvailability({
                    dayOfWeek: editor.dayOfWeek,
                    startTime: editor.startTime,
                    endTime: editor.endTime,
                    effectiveFrom: '',
                    effectiveUntil: '',
                  });
                  closeSlot();
                }}
              >
                {t.common.add}
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>

      <AvailabilityOverridesFields
        control={hoursControl}
        register={hoursRegister}
        errors={hoursErrors}
        fields={overrideFields}
        onAdd={onAddOverride}
        onRemove={onRemoveOverride}
      />
      <LeaveBlocksFields
        control={hoursControl}
        register={hoursRegister}
        errors={hoursErrors}
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
