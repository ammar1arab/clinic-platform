import { useSyncExternalStore } from 'react';
import { useLocalWeather } from '@/hooks/api/use-weather';
import { useLanguage } from '@/providers/language-provider';

const subscribe = (onChange: () => void) => {
  const id = window.setInterval(onChange, 1000);
  return () => window.clearInterval(id);
};
const snapshot = () => Math.floor(Date.now() / 1000);
const serverSnapshot = () => 0;

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

const cityFromZone = (zone: string) => zone.split('/').pop()?.replaceAll('_', ' ') ?? '';

function phaseOf(hour: number): DayPhase {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'dusk';
  return 'night';
}

export function useLocalClock() {
  const { lang } = useLanguage();
  const second = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const zoneId = second ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';
  const weather = useLocalWeather(cityFromZone(zoneId), lang).data;
  const date = new Date(second * 1000);

  return {
    ready: second > 0,
    date,
    zoneId,
    hour: date.getHours(),
    seconds: date.getSeconds(),
    phase: phaseOf(date.getHours()),
    city: weather?.city ?? cityFromZone(zoneId),
    weather,
  };
}
