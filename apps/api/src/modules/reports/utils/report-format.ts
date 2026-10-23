export { escapeHtml } from "@/infrastructure";

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function formatDisplayDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDisplayDateTime(
  date: Date | string,
  timeZone = "UTC",
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  }).format(new Date(date));
}

/** Same clock format as the web app: "9 AM", "2:45 PM". Input is "HH:mm". */
export function formatClockAmPm(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const hour12 = hours % 12 || 12;
  const period = hours < 12 ? "AM" : "PM";
  if (minutes === 0) return `${hour12} ${period}`;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function weekdayName(dayOfWeek: number) {
  return WEEKDAY_NAMES[dayOfWeek] ?? String(dayOfWeek);
}

export function blank(value: string | number | null | undefined) {
  if (value == null || value === "") return "-";
  return String(value);
}

export function cell(
  value: string | number | null | undefined,
): string | number | null {
  return value ?? null;
}

export function patientName(row: {
  firstNameEn?: string | null;
  lastNameEn?: string | null;
}) {
  return `${row.firstNameEn ?? ""} ${row.lastNameEn ?? ""}`.trim();
}

export function sortHourSlots<
  T extends { dayOfWeek: number; startTime: string },
>(slots: T[]) {
  return [...slots].sort((left, right) =>
    left.dayOfWeek === right.dayOfWeek
      ? left.startTime.localeCompare(right.startTime)
      : left.dayOfWeek - right.dayOfWeek,
  );
}

export function slugFilename(parts: string[]): string {
  return parts
    .filter(Boolean)
    .map((p) =>
      p
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    )
    .filter(Boolean)
    .join("-");
}
