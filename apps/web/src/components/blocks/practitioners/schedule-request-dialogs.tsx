'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateScheduleRequestInput, ScheduleRequestKind } from '@clinic/types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@/components/ui';
import { ButtonSpinner, ChoiceChips, DatePicker, FormField, SelectionToggle, TimePicker } from '@/components/primitives';
import { scheduleRequestSchema, type ScheduleRequestData } from '@/lib/validations';
import { useLanguage } from '@/providers';

type When = { from: string; to: string; start: string; end: string; allDay: boolean };

const DEFAULT_WHEN: When = { from: '', to: '', start: '09:00', end: '17:00', allDay: true };

function compose(kind: ScheduleRequestKind, when: When) {
  if (!when.from) return { startAt: '', endAt: '' };
  if (kind === 'vacation') return { startAt: `${when.from}T00:00`, endAt: `${when.to || when.from}T23:59` };
  if (kind === 'leave' && when.allDay) return { startAt: `${when.from}T00:00`, endAt: `${when.from}T23:59` };
  return { startAt: `${when.from}T${when.start}`, endAt: `${when.from}T${when.end}` };
}

const KINDS: ScheduleRequestKind[] = ['leave', 'vacation', 'extra'];

export function ScheduleRequestDialog({
  date = '',
  pending,
  onClose,
  onSubmit,
}: {
  date?: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: (input: CreateScheduleRequestInput) => void;
}) {
  const { t } = useLanguage();
  const copy = t.scheduleRequests;
  const [when, setWhen] = useState<When>({ ...DEFAULT_WHEN, from: date, to: date });
  const [kind, setKind] = useState<ScheduleRequestKind>('leave');
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<ScheduleRequestData>({
    resolver: zodResolver(scheduleRequestSchema),
    defaultValues: { kind: 'leave', ...compose('leave', { ...DEFAULT_WHEN, from: date }), reason: '' },
  });
  const days = kind === 'vacation';

  const change = (nextKind: ScheduleRequestKind, patch: Partial<When>) => {
    const next = { ...when, ...patch };
    const range = compose(nextKind, next);
    setWhen(next);
    setKind(nextKind);
    setValue('kind', nextKind);
    setValue('startAt', range.startAt, { shouldValidate: isSubmitted });
    setValue('endAt', range.endAt, { shouldValidate: isSubmitted });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.newRequest}</DialogTitle>
        </DialogHeader>
        <form
          id="schedule-request-form"
          noValidate
          className="space-y-4"
          onSubmit={handleSubmit((data) =>
            onSubmit({ ...data, startAt: new Date(data.startAt).toISOString(), endAt: new Date(data.endAt).toISOString() }),
          )}
        >
          <ChoiceChips
            label={copy.type}
            value={kind}
            options={KINDS.map((value) => ({ value, label: copy.kinds[value] }))}
            onChange={(value) => change(KINDS.find((item) => item === value) ?? 'leave', {})}
          />
          {kind === 'leave' ? (
            <label className="flex items-center justify-between gap-3 text-sm font-medium">
              {copy.allDay}
              <SelectionToggle label={copy.allDay} checked={when.allDay} onChange={(allDay) => change(kind, { allDay })} />
            </label>
          ) : null}
          {days ? (
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.common.from}>
                <DatePicker value={when.from} fromDate={new Date()} onChange={(from) => change(kind, { from, to: when.to && when.to < from ? from : when.to })} />
              </FormField>
              <FormField label={t.common.to} error={errors.endAt?.message}>
                <DatePicker value={when.to} fromDate={when.from ? new Date(when.from) : new Date()} onChange={(to) => change(kind, { to })} />
              </FormField>
            </div>
          ) : (
            <>
              <FormField label={copy.date}>
                <DatePicker value={when.from} fromDate={new Date()} onChange={(from) => change(kind, { from })} />
              </FormField>
              {kind === 'leave' && when.allDay ? null : (
                <div className="grid grid-cols-2 gap-3">
                  <FormField label={t.common.from}>
                    <TimePicker value={when.start} onChange={(start) => change(kind, { start })} />
                  </FormField>
                  <FormField label={t.common.to} error={errors.endAt?.message}>
                    <TimePicker value={when.end} onChange={(end) => change(kind, { end })} />
                  </FormField>
                </div>
              )}
            </>
          )}
          <FormField label={`${copy.reason} (${t.common.optional})`} error={errors.reason?.message}>
            <Textarea rows={3} maxLength={500} {...register('reason')} />
          </FormField>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" form="schedule-request-form" disabled={pending}>
            {pending ? <ButtonSpinner /> : null}
            {copy.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeclineRequestDialog({
  pending,
  onClose,
  onConfirm,
}: {
  pending: boolean;
  onClose: () => void;
  onConfirm: (reviewNote: string) => void;
}) {
  const { t } = useLanguage();
  const copy = t.scheduleRequests;
  const [note, setNote] = useState('');
  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.decline}</DialogTitle>
        </DialogHeader>
        <FormField label={copy.reviewNote}>
          <Textarea autoFocus rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
        </FormField>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="button" variant="destructive" disabled={pending || !note.trim()} onClick={() => onConfirm(note.trim())}>
            {pending ? <ButtonSpinner /> : null}
            {copy.decline}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
