'use client';

import { useState } from 'react';
import { useNow } from '@/hooks/shared/use-now';
import { cn } from '@/lib/utils';
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
  className,
}: {
  serverNow: string;
  startedAt: string | null;
  durationMins: number;
  className?: string;
}) {
  const { t } = useLanguage();
  const clientNow = useNow(1000).getTime();
  const [sample, setSample] = useState<{ server: string; skew: number } | null>(null);
  if (clientNow > 0 && sample?.server !== serverNow) {
    setSample({ server: serverNow, skew: Date.parse(serverNow) - clientNow });
  }
  const skew = sample?.server === serverNow ? sample.skew : 0;
  const official = clientNow > 0 ? clientNow + skew : Date.parse(serverNow);
  const budget = durationMins * 60_000;
  const running = startedAt ? official - Date.parse(startedAt) : null;
  const remaining = running == null ? null : budget - running;
  const overtime = remaining != null && remaining < 0;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 sm:px-4 sm:py-3',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">
          {running == null ? t.visits.timerNotStarted : overtime ? t.visits.timerOvertime : t.visits.timerRemaining}
        </p>
        <p className={cn('font-heading text-xl font-semibold tabular-nums tracking-tight sm:text-3xl', overtime && 'text-warning')}>
          {running == null ? formatClock(budget) : formatClock(Math.abs(remaining ?? 0))}
        </p>
      </div>
      <p className="text-end text-[11px] text-muted-foreground sm:text-xs">
        {t.visits.plannedDuration.replace('{minutes}', String(durationMins))}
      </p>
    </div>
  );
}
