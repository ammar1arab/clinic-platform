'use client';

import Link from 'next/link';
import { Button, Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { WEEKDAY_OPTIONS } from '@/constants/practitioner';
import { formatDate, formatTimeRange } from '@/lib/datetime';
import type { PractitionerHoursData } from '@/lib/validations';
import { useLanguage } from '@/providers';

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
            <ul className="max-h-56 space-y-1.5 overflow-y-auto overscroll-y-contain">
              {hours.availabilityOverrides.map((entry, index) => (
                <li
                  key={`${entry.startAt}-${index}`}
                  className="rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{formatDate(entry.startAt, undefined, lang)}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatTimeRange(entry.startAt, entry.endAt, undefined, lang)}
                    </span>
                  </div>
                  {entry.reason ? (
                    <p className="mt-1 text-xs text-muted-foreground">{entry.reason}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t.practitioner.noExtraAvailability}</p>
          )}
        </section>

        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t.practitioner.leave}</p>
          {hours.timeOffs.length ? (
            <ul className="max-h-56 space-y-1.5 overflow-y-auto overscroll-y-contain">
              {hours.timeOffs.map((entry, index) => (
                <li
                  key={`${entry.startDate}-${index}`}
                  className="rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <div>
                    {formatDate(entry.startDate, undefined, lang)} - {formatDate(entry.endDate, undefined, lang)}
                  </div>
                  {entry.reason ? (
                    <p className="mt-1 text-xs text-muted-foreground">{entry.reason}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t.practitioner.noLeaveBlocks}</p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
