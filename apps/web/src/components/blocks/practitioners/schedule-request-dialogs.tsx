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
import { ButtonSpinner, ChoiceChips, DatePicker, FormField, TimePicker } from '@/components/primitives';
import { scheduleRequestSchema, type ScheduleRequestData } from '@/lib/validations';
import { useLanguage } from '@/providers';
import { useClinicHours } from '@/hooks/api/use-clinic';
import { SettingsFormDialog } from '@/components/blocks/settings/settings-navigation';

type When = { from: string; to: string; start: string; end: string };

const DEFAULT_WHEN: When = { from: '', to: '', start: '09:00', end: '17:00' };

function compose(kind: ScheduleRequestKind, when: When) {
  if (!when.from) return { startAt: '', endAt: '' };
  if (kind === 'vacation') return { startAt: `${when.from}T00:00`, endAt: `${when.to || when.from}T23:59` };
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
  const clinicHours = useClinicHours();
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

  const coversClinicDay = (w: When) =>
    w.start <= clinicHours.start && w.end >= clinicHours.end;

  const submitRequest = handleSubmit((data) =>
    onSubmit({ ...data, startAt: new Date(data.startAt).toISOString(), endAt: new Date(data.endAt).toISOString() }),
  );

  const changeTime = (patch: Partial<When>) => {
    const next = { ...when, ...patch };
    change(kind === 'extra' ? kind : coversClinicDay(next) ? 'vacation' : 'leave', patch);
  };

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
    <SettingsFormDialog
      open
      onOpenChange={(open) => !open && !pending && onClose()}
      editing={false}
      addTitle={copy.newRequest}
      pending={pending}
      disabled={false}
      onSubmit={() => void submitRequest()}
    >
        <div className="space-y-4">
          <ChoiceChips
            label={copy.type}
            value={kind}
            options={KINDS.map((value) => ({ value, label: copy.kinds[value] }))}
            onChange={(value) => change(KINDS.find((item) => item === value) ?? 'leave', {})}
          />
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
              <div className="grid grid-cols-2 gap-3">
                <FormField label={t.common.from}>
                  <TimePicker value={when.start} onChange={(start) => changeTime({ start })} range={clinicHours} />
                </FormField>
                <FormField label={t.common.to} error={errors.endAt?.message}>
                  <TimePicker value={when.end} onChange={(end) => changeTime({ end })} range={clinicHours} />
                </FormField>
              </div>
            </>
          )}
          <FormField label={`${copy.reason} (${t.common.optional})`} error={errors.reason?.message}>
            <Textarea rows={3} maxLength={500} {...register('reason')} />
          </FormField>
        </div>
    </SettingsFormDialog>
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
