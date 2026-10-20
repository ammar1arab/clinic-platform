import { QUERY_KEYS } from "@/constants/query-keys";
import { weatherService, type LocalWeather } from "@/services/weather.service";
import { useFetchData } from "../query";

export function useLocalWeather(city: string, lang: string) {
  return useFetchData<LocalWeather>({
    queryKey: QUERY_KEYS.weather(city, lang),
    request: () => weatherService.getByCity(city, lang),
    options: { enabled: !!city, staleTime: 15 * 60_000, retry: false },
  });
}
