import { getTranslations } from '@/i18n';
export type CompressOptions = {
  maxEdge?: number;
  quality?: number;
  maxBytes?: number;
  minQuality?: number;
};

export class ImageCompressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageCompressError';
  }
}

async function toBitmap(source: Blob): Promise<ImageBitmap> {
  if (typeof createImageBitmap === 'function') return createImageBitmap(source);
  throw new ImageCompressError(getTranslations().uploads.browser);
}

async function toJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  );
  if (!blob) throw new ImageCompressError(getTranslations().uploads.encode);
  return blob;
}

export async function compressImageToJpeg(
  input: File | Blob,
  options: CompressOptions = {},
): Promise<File> {
  if (typeof window === 'undefined') {
    throw new ImageCompressError(getTranslations().uploads.browser);
  }

  const maxEdge = options.maxEdge ?? 1600;
  const maxBytes = options.maxBytes ?? 3 * 1024 * 1024;
  const minQuality = options.minQuality ?? 0.55;
  let quality = options.quality ?? 0.88;

  const type = (input.type || '').toLowerCase();
  if (type && !type.startsWith('image/')) {
    throw new ImageCompressError(getTranslations().uploads.type);
  }
  if ('size' in input && input.size > 20 * 1024 * 1024) {
    throw new ImageCompressError(getTranslations().uploads.size);
  }

  const bitmap = await toBitmap(input);
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new ImageCompressError(getTranslations().uploads.canvas);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    let blob = await toJpeg(canvas, quality);
    while (blob.size > maxBytes && quality > minQuality + 0.01) {
      quality = Math.max(minQuality, quality - 0.08);
      blob = await toJpeg(canvas, quality);
    }

    const base =
      input instanceof File
        ? input.name
            .replace(/\.[^.]+$/, '')
            .replace(/[^a-zA-Z0-9_-]+/g, '-')
            .slice(0, 60)
        : 'image';

    return new File([blob], `${base || 'image'}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

export async function uploadCompressedLocalImage(
  input: File | Blob,
  options?: CompressOptions,
): Promise<{ url: string; filename: string }> {
  const jpeg = await compressImageToJpeg(input, options);
  const url = URL.createObjectURL(jpeg);
  return { url, filename: jpeg.name };
}
