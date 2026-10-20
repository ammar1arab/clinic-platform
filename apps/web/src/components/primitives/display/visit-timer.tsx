'use client';

import { useCallback, useState } from 'react';
import { useNow } from '@/hooks/shared/use-now';
import { IconTime } from '@/constants/icons';
import { cn } from '@/lib/utils';
import { ClockReadout } from './clock-readout';
import { useLanguage } from '@/providers';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function VisitTimer({
  serverNow,
  startedAt,
  durationMins,
  finishedAt,
  className,
  compact = false,
}: {
  serverNow: string;
  startedAt: string | null;
  durationMins: number;
  finishedAt?: string | null;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const clientNow = useNow(finishedAt ? 60_000 : 1000).getTime();
  const [sample, setSample] = useState<{ server: string; skew: number } | null>(null);
  const bind = useCallback((node: HTMLDivElement | null) => {
    if (node) setSample({ server: serverNow, skew: Date.parse(serverNow) - Date.now() });
  }, [serverNow]);
  const official = sample?.server === serverNow
    ? Math.max(Date.parse(serverNow), clientNow + sample.skew)
    : Date.parse(serverNow);
  const budget = durationMins * 60_000;
  const running = startedAt ? (finishedAt ? Date.parse(finishedAt) : official) - Date.parse(startedAt) : null;
  const remaining = running == null ? null : budget - running;
  const overtime = remaining != null && remaining < 0;
  const shown = finishedAt ? formatClock(running ?? 0) : running == null ? formatClock(budget) : formatClock(Math.abs(remaining ?? 0));

  return (
    <div
      ref={bind}
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 sm:px-4 sm:py-3',
        compact && 'w-fit gap-1.5 rounded-lg border-0 bg-transparent p-0 sm:p-0',
        className,
      )}
    >
      {compact ? <IconTime className="size-4 shrink-0 text-muted-foreground max-sm:hidden" /> : null}
      <div className={cn("min-w-0", compact && "flex items-center gap-2")}>
        <p className={cn("text-[11px] font-medium text-muted-foreground sm:text-xs", compact && "sr-only sm:not-sr-only")}>
          {finishedAt ? t.visits.timerFinished : running == null ? t.visits.timerNotStarted : overtime ? t.visits.timerOvertime : t.visits.timerRemaining}
        </p>
        <p className={cn('font-heading text-xl font-semibold tabular-nums tracking-tight sm:text-3xl', compact && 'whitespace-nowrap text-sm sm:text-base', overtime && !finishedAt && 'text-warning')}>
          <ClockReadout main={shown.slice(0, -3)} minor={shown.slice(-3)} minorClassName="text-inherit" />
        </p>
      </div>
      <p className={cn("text-end text-[11px] text-muted-foreground sm:text-xs", compact && "hidden")}>
        {t.visits.plannedDuration.replace('{minutes}', String(durationMins))}
      </p>
    </div>
  );
}
