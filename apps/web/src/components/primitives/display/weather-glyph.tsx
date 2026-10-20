import type { WeatherKind } from "@/services/weather.service";
import { cn } from "@/lib/utils";

const CLOUD = "M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 8.5a4.75 4.75 0 0 1 .5 9.5Z";

export function WeatherGlyph({ kind, night, className }: { kind: WeatherKind; night: boolean; className?: string }) {
  const clear = kind === "clear";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("size-4 shrink-0", className)}>
      {clear && !night ? (
        <g className="text-warning">
          <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.25" />
          <g className="wx-spin">
            <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
          </g>
        </g>
      ) : null}
      {clear && night ? (
        <g className="text-primary">
          <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" fill="currentColor" fillOpacity="0.2" />
          <circle cx="18" cy="5" r="0.7" fill="currentColor" className="wx-twinkle" />
          <circle cx="21" cy="9" r="0.5" fill="currentColor" className="wx-twinkle wx-late" />
        </g>
      ) : null}
      {kind === "fog" ? (
        <g className="text-muted-foreground">
          <path d={CLOUD} transform="translate(0 -3)" />
          <path d="M5 19h14" className="wx-slide" />
          <path d="M8 22h10" className="wx-slide wx-late" />
        </g>
      ) : null}
      {kind === "cloudy" ? <path d={CLOUD} className="wx-drift text-muted-foreground" fill="currentColor" fillOpacity="0.15" /> : null}
      {kind === "rain" || kind === "snow" || kind === "storm" ? (
        <g className="text-info">
          <path d={CLOUD} transform="translate(0 -4)" className="text-muted-foreground" fill="currentColor" fillOpacity="0.15" />
          {kind === "rain" ? (
            <>
              <path d="M8 16.5v2" className="wx-fall" />
              <path d="M12 16.5v2" className="wx-fall wx-mid" />
              <path d="M16 16.5v2" className="wx-fall wx-late" />
            </>
          ) : null}
          {kind === "snow" ? (
            <>
              <circle cx="8" cy="17.5" r="0.9" fill="currentColor" className="wx-fall" />
              <circle cx="12" cy="17.5" r="0.9" fill="currentColor" className="wx-fall wx-mid" />
              <circle cx="16" cy="17.5" r="0.9" fill="currentColor" className="wx-fall wx-late" />
            </>
          ) : null}
          {kind === "storm" ? <path d="m12.5 13-2.5 4h3l-1.5 4" className="wx-flash text-warning" /> : null}
        </g>
      ) : null}
    </svg>
  );
}
