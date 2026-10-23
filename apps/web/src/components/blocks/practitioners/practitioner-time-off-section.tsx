'use client';

import type { ReactNode } from 'react';
import type { DoctorTimeOffEntry } from '@clinic/types';
import {
  ProfileEmpty,
  ProfileInfoField,
  ProfileInfoGrid,
  ProfileSection,
  ProfileSoftRow,
} from '@/components/primitives';
import { formatDate, formatDateTimeRange } from '@/lib/datetime';
import { useLanguage } from '@/providers';

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
      contentClassName="max-h-56 overflow-y-auto overscroll-y-contain"
    >
      {summary ? (
        <ProfileInfoGrid>
          <ProfileInfoField label={summary.label} value={String(summary.value)} />
        </ProfileInfoGrid>
      ) : null}
      {entries.length === 0 ? (
        <ProfileEmpty>{emptyLabel}</ProfileEmpty>
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
