const AVATAR_IDS = [1, 2, 3, 5, 7, 8, 11, 12, 13, 14, 16, 17, 18, 22, 26] as const;
const AVATAR_ID_SET = new Set<number>(AVATAR_IDS);
const STOCK_AVATAR_RE = /\/avatars\/avatar-(\d+)(?:-v2)?\.webp$/;

export const AVATAR_COUNT = AVATAR_IDS.length;

export function avatarPath(index: number): string {
  const n = ((index % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT;
  return `/avatars/avatar-${AVATAR_IDS[n]}-v2.webp`;
}

export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function defaultAvatarUrl(seed: string): string {
  return avatarPath(hashSeed(seed || 'cureva'));
}

export function resolveAvatarUrl(
  imageUrl: string | null | undefined,
  seed: string,
): string {
  const trimmed = imageUrl?.trim();
  if (trimmed && !trimmed.startsWith('blob:')) {
    const match = trimmed.match(STOCK_AVATAR_RE);
    if (match && !AVATAR_ID_SET.has(Number(match[1]))) {
      return defaultAvatarUrl(seed);
    }
    return trimmed;
  }
  return defaultAvatarUrl(seed);
}

export function pickRandomAvatarUrl(): string {
  return avatarPath(Math.floor(Math.random() * AVATAR_COUNT));
}

export function persistableImageUrl(
  imageUrl: string | null | undefined,
): string | undefined {
  const trimmed = imageUrl?.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob%3A')
  ) {
    return undefined;
  }
  return trimmed;
}
