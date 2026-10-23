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
  count,
  dateOnly = false,
}: {
  title: string;
  entries: DoctorTimeOffEntry[];
  emptyLabel: string;
  action?: ReactNode;
  count: number;
  dateOnly?: boolean;
}) {
  const { lang } = useLanguage();

  return (
    <ProfileSection
      title={title}
      action={<div className="flex items-center gap-2">{action}<CountBadge count={count} /></div>}
      fixedHeight
      contentClassName="flex flex-col gap-3"
    >
      {entries.length === 0 ? (
        <EmptyState icon={dateOnly ? IconCalendar : IconCalendarClock} title={emptyLabel} size="compact" className="flex-1" />
      ) : (
        <div className="space-y-1.5">
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
