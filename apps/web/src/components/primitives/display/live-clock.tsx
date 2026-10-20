'use client';

import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers/language-provider';
import { useLocalClock } from '@/hooks/shared/use-local-clock';
import { ClockReadout } from './clock-readout';
import { WeatherGlyph } from './weather-glyph';

export function LiveClock({ className }: { className?: string }) {
  const { t } = useLanguage();
  const { ready, date, hour, phase, seconds, city, weather } = useLocalClock();
  const hm = ready ? `${hour % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')}` : '--:--';
  const ss = ready ? `:${String(seconds).padStart(2, '0')}` : '';
  const period = ready ? (hour < 12 ? t.time.am : t.time.pm) : '';

  return (
    <p className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums', className)}>
      <span dir="ltr" role="timer" aria-live="off" className="inline-flex items-center gap-1.5">
        {ready ? <WeatherGlyph kind="clear" night={phase === 'night'} className="size-4" /> : null}
        <ClockReadout main={hm} minor={ss} suffix={period} className="font-medium text-foreground" minorClassName="font-normal" />
      </span>
      {weather ? (
        <span className="inline-flex items-center gap-1.5">
          <WeatherGlyph kind={weather.kind} night={phase === 'night'} className="size-4" />
          <span dir="ltr" className="font-medium text-foreground">{weather.temperature}°</span>
          <span>{t.dashboard.weather[weather.kind]}</span>
          <span aria-hidden="true">·</span>
          <bdi>{city}</bdi>
        </span>
      ) : city ? <bdi>{city}</bdi> : null}
    </p>
  );
}
