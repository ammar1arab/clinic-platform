export type ClinicBrandCache = {
  logoUrl: string | null;
  brandColor: string | null;
  stamp: string;
};

const brandKey = (clinicId: string) => `clinic-brand:${clinicId}`;
const activeBrandKey = 'clinic-brand:active';
const legacyLogoKey = (clinicId: string) => `clinic-logo:${clinicId}`;
const legacyActiveKey = 'clinic-logo:active';
export const CLINIC_BRAND_EVENT = 'clinic-brand';

const stripped = new Map<string, string>();

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('logo'));
    image.src = src;
  });
}

export function versionedAssetUrl(url: string, stamp: string) {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
  try {
    const parsed = new URL(url, typeof window === 'undefined' ? 'https://local.invalid' : window.location.origin);
    parsed.searchParams.set('v', stamp);
    return parsed.toString();
  } catch {
    return url;
  }
}

function parseBrand(raw: string | null): ClinicBrandCache | null {
  if (!raw) return null;
  if (raw.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) &&
        (!('logoUrl' in parsed) || parsed.logoUrl === null || typeof parsed.logoUrl === 'string') &&
        (!('brandColor' in parsed) || parsed.brandColor === null || typeof parsed.brandColor === 'string') &&
        (!('stamp' in parsed) || typeof parsed.stamp === 'string')) {
        return {
          logoUrl: 'logoUrl' in parsed && typeof parsed.logoUrl === 'string' ? parsed.logoUrl : null,
          brandColor: 'brandColor' in parsed && typeof parsed.brandColor === 'string' ? parsed.brandColor : null,
          stamp: 'stamp' in parsed && typeof parsed.stamp === 'string' ? parsed.stamp || '0' : '0',
        };
      }
      return null;
    } catch {
      return null;
    }
  }
  return { logoUrl: raw, brandColor: null, stamp: '0' };
}

function forgetLegacyKeys() {
  try {
    const remove: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith('clinic-logo:')) remove.push(key);
    }
    remove.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* storage may be blocked */
  }
}

export async function stripSolidBackdrop(src: string) {
  const cached = stripped.get(src);
  if (cached) return cached;
  if (typeof document === 'undefined' || !src.startsWith('data:image/')) {
    stripped.set(src, src);
    return src;
  }

  try {
    const image = await loadImage(src);
    if (!image.naturalWidth || !image.naturalHeight) return src;
    const scale = Math.min(1, 256 / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return src;
    ctx.drawImage(image, 0, 0, width, height);
    const optimized = scale < 1 ? canvas.toDataURL('image/png') : src;
    const frame = ctx.getImageData(0, 0, width, height);
    const data = frame.data;
    const at = (x: number, y: number) => {
      const index = (y * width + x) * 4;
      return [data[index], data[index + 1], data[index + 2], data[index + 3]];
    };
    const corners = [at(0, 0), at(width - 1, 0), at(0, height - 1), at(width - 1, height - 1)];
    if (corners.some((pixel) => pixel[3] < 240)) {
      stripped.set(src, optimized);
      return optimized;
    }
    const average = [0, 1, 2].map((channel) =>
      Math.round(corners.reduce((sum, pixel) => sum + pixel[channel], 0) / corners.length),
    );
    const uneven = corners.some((pixel) =>
      [0, 1, 2].some((channel) => Math.abs(pixel[channel] - average[channel]) > 18),
    );
    if (uneven) {
      stripped.set(src, optimized);
      return optimized;
    }

    let changed = false;
    let opaque = 0;
    for (let index = 0; index < data.length; index += 4) {
      const distance = Math.hypot(
        data[index] - average[0],
        data[index + 1] - average[1],
        data[index + 2] - average[2],
      );
      if (distance <= 32) {
        data[index + 3] = 0;
        changed = true;
      } else if (distance < 56) {
        data[index + 3] = Math.round(((distance - 32) / 24) * data[index + 3]);
        changed = true;
      }
      if (data[index + 3] > 16) opaque += 1;
    }
    if (!changed || opaque < width * height * 0.04) {
      stripped.set(src, optimized);
      return optimized;
    }
    ctx.putImageData(frame, 0, 0);
    const next = canvas.toDataURL('image/png');
    stripped.set(src, next);
    stripped.set(next, next);
    return next;
  } catch {
    stripped.set(src, src);
    return src;
  }
}

export function readClinicBrand(clinicId?: string): ClinicBrandCache | null {
  if (typeof window === 'undefined') return null;
  try {
    if (clinicId) {
      const current = parseBrand(localStorage.getItem(brandKey(clinicId)));
      if (current) return current;
      const legacy = parseBrand(localStorage.getItem(legacyLogoKey(clinicId)));
      return legacy;
    }
    return parseBrand(localStorage.getItem(activeBrandKey) ?? localStorage.getItem(legacyActiveKey));
  } catch {
    return null;
  }
}

export function readClinicLogo(clinicId: string) {
  return readClinicBrand(clinicId)?.logoUrl ?? null;
}

export function readActiveClinicLogo() {
  return readClinicBrand()?.logoUrl ?? null;
}

export function writeClinicBrand(
  clinicId: string,
  brand: { logoUrl?: string | null; brandColor?: string | null; stamp?: string },
) {
  if (!clinicId || typeof window === 'undefined') return;
  try {
    const previous = readClinicBrand(clinicId);
    const payload: ClinicBrandCache = {
      logoUrl: brand.logoUrl !== undefined ? brand.logoUrl : previous?.logoUrl ?? null,
      brandColor: brand.brandColor !== undefined ? brand.brandColor : previous?.brandColor ?? null,
      stamp: brand.stamp || String(Date.now()),
    };
    if (
      previous &&
      previous.logoUrl === payload.logoUrl &&
      previous.brandColor === payload.brandColor &&
      previous.stamp === payload.stamp
    ) {
      return;
    }
    const raw = JSON.stringify(payload);
    localStorage.setItem(brandKey(clinicId), raw);
    localStorage.setItem(activeBrandKey, raw);
    forgetLegacyKeys();
    stripped.clear();
    window.dispatchEvent(new Event(CLINIC_BRAND_EVENT));
    window.dispatchEvent(new Event('clinic-logo'));
  } catch {
    /* the picture still lives in the current page cache */
  }
}

export function writeClinicLogo(clinicId: string, url: string | null) {
  writeClinicBrand(clinicId, { logoUrl: url, stamp: String(Date.now()) });
}

function brandChannels(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (piece: number) => {
    const srgb = piece / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  const red = channel((value >> 16) & 255);
  const green = channel((value >> 8) & 255);
  const blue = channel(value & 255);
  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.min(0.18, Math.hypot(a, b));
  const hue = (Math.atan2(b, a) * 180) / Math.PI;
  return { chroma: chroma.toFixed(3), hue: (((hue % 360) + 360) % 360).toFixed(1) };
}

export function applyClinicBrandChrome(brand: {
  logoUrl: string | null;
  brandColor: string | null;
  stamp?: string;
}) {
  if (typeof document === 'undefined') return () => undefined;
  const head = document.head;
  const owned = ['icon', 'apple-touch-icon'] as const;
  const brandStyleId = 'clinic-brand';
  const stamp = brand.stamp ?? '';
  const href = brand.logoUrl ? versionedAssetUrl(brand.logoUrl, stamp) : null;

  owned.forEach((rel) => head.querySelector(`link[data-clinic-logo="${rel}"]`)?.remove());
  if (href) {
    owned.forEach((rel) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      link.setAttribute('data-clinic-logo', rel);
      link.setAttribute('data-clinic-stamp', stamp);
      head.appendChild(link);
    });
  }

  head.querySelector(`style[data-clinic-brand="${brandStyleId}"]`)?.remove();
  if (brand.brandColor && /^#[0-9A-Fa-f]{6}$/.test(brand.brandColor)) {
    const { chroma, hue } = brandChannels(brand.brandColor);
    const style = document.createElement('style');
    style.setAttribute('data-clinic-brand', brandStyleId);
    style.textContent = [
      `:root{--primary:oklch(0.55 ${chroma} ${hue});--ring:var(--primary);--brand:var(--primary)}`,
      `.dark{--primary:oklch(0.62 ${chroma} ${hue});--ring:var(--primary);--brand:var(--primary)}`,
    ].join('');
    head.appendChild(style);
  }

  return () => {
    owned.forEach((rel) => head.querySelector(`link[data-clinic-logo="${rel}"]`)?.remove());
    head.querySelector(`style[data-clinic-brand="${brandStyleId}"]`)?.remove();
  };
}
