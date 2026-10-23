'use client';

import type { ReactNode } from 'react';
import type { DoctorTimeOffEntry } from '@clinic/types';
import {
  CountBadge,
  EmptyState,
  ProfileSection,
  ProfileSoftRow,
} from '@/components/primitives';
import { formatDate, formatDateTimeRange } from '@/lib/datetime';
import { useLanguage } from '@/providers';
import { IconCalendar, IconCalendarClock } from '@/constants/icons';

export function PractitionerTimeOffSection({
  title,
  entries,
  emptyLabel,
  action,
  summary,
  dateOnly = false,
}: {
  title: string;
  entries: DoctorTimeOffEntry[];
  emptyLabel: string;
  action?: ReactNode;
  summary?: { label: string; value: number };
  dateOnly?: boolean;
}) {
  const { lang } = useLanguage();

  return (
    <ProfileSection
      title={title}
      action={action}
      className="h-full"
      contentClassName="flex flex-col gap-3"
    >
      {summary ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
          <span className="text-xs text-muted-foreground">{summary.label}</span>
          <CountBadge count={summary.value} />
        </div>
      ) : null}
      {entries.length === 0 ? (
        <EmptyState icon={dateOnly ? IconCalendar : IconCalendarClock} title={emptyLabel} size="compact" className="flex-1" />
      ) : (
        <div className="max-h-56 space-y-1.5 overflow-y-auto overscroll-y-contain">
          {entries.map((block, index) => (
            <ProfileSoftRow
              key={block.id ?? `${block.startDate}-${index}`}
              title={
                dateOnly
                  ? `${formatDate(block.startDate, undefined, lang)} - ${formatDate(block.endDate, undefined, lang)}`
                  : formatDateTimeRange(block.startDate, block.endDate, undefined, lang)
              }
              detail={block.reason}
            />
          ))}
        </div>
      )}
    </ProfileSection>
  );
}
