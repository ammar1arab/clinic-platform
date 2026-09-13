'use client';

import { useFieldArray, useWatch, type Control } from 'react-hook-form';
import { toDateParam } from '@/lib/datetime';
import type { PractitionerHoursData } from '@/lib/validations';
import { useConfirm, useLanguage } from '@/providers';

export function useHoursFields<T extends PractitionerHoursData>(control: Control<T>) {
  const confirm = useConfirm();
  const { t } = useLanguage();
  const availabilities = useFieldArray({ control, name: 'availabilities' });
  const timeOffs = useFieldArray({ control, name: 'timeOffs' });
  const availabilityOverrides = useFieldArray({ control, name: 'availabilityOverrides' });
  const watchedAvailabilities = useWatch({ control, name: 'availabilities' });
  const watchedTimeOffs = useWatch({ control, name: 'timeOffs' });
  const watchedOverrides = useWatch({ control, name: 'availabilityOverrides' });

  const askRemove = async (title: string, description: string, run: () => void) => {
    const ok = await confirm({
      title,
      description,
      confirmLabel: t.common.remove,
      variant: 'destructive',
    });
    if (ok) run();
    return ok;
  };

  const today = toDateParam(new Date());

  return {
    values: {
      availabilities: watchedAvailabilities ?? [],
      timeOffs: watchedTimeOffs ?? [],
      availabilityOverrides: watchedOverrides ?? [],
    } satisfies PractitionerHoursData,
    overrideFields: availabilityOverrides.fields,
    leaveFields: timeOffs.fields,
    onAddAvailability: availabilities.append,
    onRemoveAvailability: (index: number) =>
      askRemove(
        t.practitioner.removeAvailabilityTitle,
        t.practitioner.removeAvailabilityDesc,
        () => availabilities.remove(index),
      ),
    onAddOverride: () =>
      availabilityOverrides.append({
        startAt: `${today}T09:00`,
        endAt: `${today}T17:00`,
        reason: '',
      }),
    onRemoveOverride: (index: number) =>
      askRemove(
        t.practitioner.removeExtraTitle,
        t.practitioner.removeExtraDesc,
        () => availabilityOverrides.remove(index),
      ),
    onAddLeave: () =>
      timeOffs.append({ startDate: today, endDate: today, reason: '' }),
    onRemoveLeave: (index: number) =>
      askRemove(
        t.practitioner.removeLeaveTitle,
        t.practitioner.removeLeaveDesc,
        () => timeOffs.remove(index),
      ),
  };
}
