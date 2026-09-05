export * from "./infrastructure.module";
export * from "./redis.service";
export * from "./email.service";
export * from "./storage.service";
export * from "./logger";
export * from "./i18n.context";
export * from "./i18n.middleware";
export const corsOrigin =
  process.env.NODE_ENV === "production"
    ? ["https://cureva.clinic", "https://www.cureva.clinic"]
    : true;

const AVATAR_IDS = [
  1, 2, 3, 5, 7, 8, 11, 12, 13, 14, 16, 17, 18, 22, 26,
] as const;
const AVATAR_COUNT = AVATAR_IDS.length;

export function defaultAvatarUrl(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const n = (h >>> 0) % AVATAR_COUNT;
  return `/avatars/avatar-${AVATAR_IDS[n]}-v2.webp`;
}

export function persistableImageUrl(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return null;
  return trimmed;
}

export function formatPhoneDisplay(value: string | null | undefined): string {
  const raw = value?.trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("962") && digits.length >= 12) {
    return `0${digits.slice(3)}`;
  }
  if (digits.length === 9 && digits.startsWith("7")) {
    return `0${digits}`;
  }
  if (digits.startsWith("0") && digits.length >= 10) {
    return digits;
  }
  return raw;
}
