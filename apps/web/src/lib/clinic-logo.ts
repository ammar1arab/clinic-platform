const keyFor = (clinicId: string) => `clinic-logo:${clinicId}`;
const activeKey = 'clinic-logo:active';

const stripped = new Map<string, string>();

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('logo'));
    image.src = src;
  });
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

export function readClinicLogo(clinicId: string) {
  if (!clinicId || typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(keyFor(clinicId));
  } catch {
    return null;
  }
}

export function readActiveClinicLogo() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(activeKey);
  } catch {
    return null;
  }
}

export function writeClinicLogo(clinicId: string, url: string | null) {
  if (!clinicId || typeof window === 'undefined') return;
  try {
    if (url) {
      localStorage.setItem(keyFor(clinicId), url);
      localStorage.setItem(activeKey, url);
    } else {
      localStorage.removeItem(keyFor(clinicId));
      localStorage.removeItem(activeKey);
    }
    window.dispatchEvent(new Event('clinic-logo'));
  } catch {
    /* the picture still lives in the current page cache */
  }
}
