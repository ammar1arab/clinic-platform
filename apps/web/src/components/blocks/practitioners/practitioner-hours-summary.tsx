'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { CountBadge, EmptyState, ProfileSection } from '@/components/primitives';
import { WEEKDAY_OPTIONS } from '@/constants/practitioner';
import { IconCalendarClock } from '@/constants/icons';
import { formatDateTimeRange, formatTimeRange } from '@/lib/datetime';
import type { PractitionerHoursData } from '@/lib/validations';
import { useLanguage } from '@/providers';
import { cn } from '@/lib/utils';
import { PractitionerTimeOffSection } from './practitioner-time-off-section';
import { splitTimeOff } from './time-off';

type WeeklySlot = PractitionerHoursData['availabilities'][number];

function groupWeekly(slots: WeeklySlot[]) {
  const sorted = [...slots].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
  const groups: { days: number[]; startTime: string; endTime: string }[] = [];
  for (const slot of sorted) {
    const last = groups.at(-1);
    if (last && last.startTime === slot.startTime && last.endTime === slot.endTime && last.days.at(-1) === slot.dayOfWeek - 1) {
      last.days.push(slot.dayOfWeek);
    } else {
      groups.push({ days: [slot.dayOfWeek], startTime: slot.startTime, endTime: slot.endTime });
    }
  }
  return groups;
}

export function PractitionerHoursSummary({
  hours,
  href,
}: {
  hours: PractitionerHoursData;
  href?: string;
}) {
  const { t, lang } = useLanguage();
  const { vacations, leaves, vacationDays } = splitTimeOff(hours.timeOffs, new Date().getFullYear());
  const dayName = (day: number) => t.constants.weekdays[WEEKDAY_OPTIONS[day]];

  return (
    <div className="space-y-3 sm:space-y-4">
      <ProfileSection
        title={t.practitioner.weeklyAvailability}
        action={href ? (
          <Button asChild variant="outline" size="sm">
            <Link href={href}>{t.common.edit}</Link>
          </Button>
        ) : undefined}
      >
        {hours.availabilities.length ? (
          <ul className="space-y-1.5">
            {groupWeekly(hours.availabilities).map((group) => (
              <li
                key={`${group.days[0]}-${group.startTime}`}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm"
              >
                <span>
                  {group.days.length > 1
                    ? `${dayName(group.days[0])} – ${dayName(group.days[group.days.length - 1])}`
                    : dayName(group.days[0])}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {formatTimeRange(group.startTime, group.endTime, undefined, lang)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState framed={false} size="compact" icon={IconCalendarClock} title={t.practitioner.noWeeklyPatterns} />
        )}
      </ProfileSection>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <ProfileSection
          title={t.practitioner.extraAvailability}
          action={<CountBadge count={hours.availabilityOverrides.length} />}
          fixedHeight
          contentClassName="flex flex-col"
        >
          {hours.availabilityOverrides.length ? (
            <ScheduleEntryList
              entries={hours.availabilityOverrides.map((entry) => ({ title: entry.reason, start: entry.startAt, end: entry.endAt }))}
              fallback={t.practitioner.extraAvailability}
            />
          ) : (
            <EmptyState framed={false} size="compact" icon={IconCalendarClock} title={t.practitioner.extraAvailability} className="flex-1" />
          )}
        </ProfileSection>
        <PractitionerTimeOffSection
          title={t.scheduleRequests.kinds.vacation}
          entries={vacations}
          emptyLabel={t.practitioner.noVacations}
          count={vacationDays}
          dateOnly
        />
        <PractitionerTimeOffSection
          title={t.practitioner.leave}
          entries={leaves}
          emptyLabel={t.practitioner.noLeaveBlocks}
          count={leaves.length}
        />
      </div>
    </div>
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
