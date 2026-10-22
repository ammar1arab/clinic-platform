'use client';

import Link from 'next/link';
import { Button, Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { WEEKDAY_OPTIONS } from '@/constants/practitioner';
import { formatDateTimeRange, formatTimeRange } from '@/lib/datetime';
import type { PractitionerHoursData } from '@/lib/validations';
import { useLanguage } from '@/providers';
import { cn } from '@/lib/utils';

export function PractitionerHoursSummary({
  hours,
  href,
}: {
  hours: PractitionerHoursData;
  href?: string;
}) {
  const { t, lang } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t.practitioner.workingHours}</CardTitle>
        {href ? (
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href={href}>{t.common.edit}</Link>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t.practitioner.weeklyAvailability}</p>
          {hours.availabilities.length ? (
            <ul className="max-h-56 space-y-1.5 overflow-y-auto overscroll-y-contain">
              {hours.availabilities.map((slot, index) => (
                <li
                  key={`${slot.dayOfWeek}-${slot.startTime}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <span>{t.constants.weekdays[WEEKDAY_OPTIONS[slot.dayOfWeek]]}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatTimeRange(slot.startTime, slot.endTime, undefined, lang)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t.practitioner.noWeeklyPatterns}</p>
          )}
        </section>

        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t.practitioner.extraAvailability}</p>
          {hours.availabilityOverrides.length ? (
            <ScheduleEntryList
              className="max-h-56 overflow-y-auto overscroll-y-contain"
              entries={hours.availabilityOverrides.map((entry) => ({ title: entry.reason, start: entry.startAt, end: entry.endAt }))}
              fallback={t.practitioner.extraAvailability}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t.practitioner.noExtraAvailability}</p>
          )}
        </section>

        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t.practitioner.leave}</p>
          {hours.timeOffs.length ? (
            <ScheduleEntryList
              className="max-h-56 overflow-y-auto overscroll-y-contain"
              entries={hours.timeOffs.map((entry) => ({ title: entry.reason, start: entry.startDate, end: entry.endDate }))}
              fallback={t.practitioner.leave}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t.practitioner.noLeaveBlocks}</p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

export function ScheduleEntryList({
  entries,
  fallback,
  className,
}: {
  entries: { title?: string | null; start: string; end: string }[];
  fallback: string;
  className?: string;
}) {
  const { lang } = useLanguage();
  return (
    <ul className={cn('space-y-2', className)}>
      {entries.map((entry, index) => (
        <li key={`${entry.start}-${index}`} className="min-w-0 rounded-lg bg-muted/50 px-3 py-2">
          <p className="truncate text-sm font-medium">{entry.title?.trim() || fallback}</p>
          <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{formatDateTimeRange(entry.start, entry.end, undefined, lang)}</p>
        </li>
      ))}
    </ul>
  );
}
