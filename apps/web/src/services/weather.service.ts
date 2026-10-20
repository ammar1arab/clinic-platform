export type WeatherKind = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";

export interface LocalWeather {
  city: string;
  temperature: number;
  kind: WeatherKind;
}

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

function kindFromCode(code: number): WeatherKind {
  if (code >= 95) return "storm";
  if (code >= 71 && code <= 77) return "snow";
  if (code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code === 45 || code === 48) return "fog";
  if (code === 2 || code === 3) return "cloudy";
  return "clear";
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`weather_${response.status}`);
  return response.json() as Promise<T>;
}

export const weatherService = {
  getByCity: async (query: string, lang: string): Promise<LocalWeather> => {
    const places = await getJson<{ results?: { name: string; latitude: number; longitude: number }[] }>(
      `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=1&language=${lang}`,
    );
    const place = places.results?.[0];
    if (!place) throw new Error("weather_no_place");
    const forecast = await getJson<{ current: { temperature_2m: number; weather_code: number } }>(
      `${FORECAST_URL}?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code`,
    );
    return {
      city: place.name,
      temperature: Math.round(forecast.current.temperature_2m),
      kind: kindFromCode(forecast.current.weather_code),
    };
  },
};
