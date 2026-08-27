export type CompressToJpegOptions = {
  /** Longest edge after resize. Default 1024. */
  maxEdge?: number;
  /** Initial JPEG quality 0–1. Default 0.82. */
  quality?: number;
  /** Soft ceiling; quality steps down until under this. Default 3 MB. */
  maxBytes?: number;
  /** Floor quality while shrinking. Default 0.55. */
  minQuality?: number;
};

export class ImageCompressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageCompressError';
  }
}

const ACCEPTED = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
]);

function assertBrowser(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new ImageCompressError('Image compression only runs in the browser');
  }
}

function loadBitmap(source: Blob): Promise<ImageBitmap> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(source);
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new ImageCompressError('Canvas is unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      createImageBitmap(canvas).then(resolve, reject);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageCompressError('Could not read image file'));
    };
    img.src = url;
  });
}

function scaledSize(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new ImageCompressError('JPEG encode failed'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality,
    );
  });
}

function jpegFileName(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, '').trim() || 'image';
  const safe = base.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 60);
  return `${safe || 'image'}.jpg`;
}

/**
 * Decode → downscale → encode JPEG. Used before local/temp uploads
 * (and later object storage). Keeps EXIF orientation via createImageBitmap
 * when the browser supports it.
 */
export async function compressImageToJpeg(
  input: File | Blob,
  options: CompressToJpegOptions = {},
): Promise<File> {
  assertBrowser();

  const maxEdge = options.maxEdge ?? 1600;
  const maxBytes = options.maxBytes ?? 3 * 1024 * 1024;
  const minQuality = options.minQuality ?? 0.55;
  let quality = options.quality ?? 0.88;

  const type = (input.type || '').toLowerCase();
  if (type && !ACCEPTED.has(type) && !type.startsWith('image/')) {
    throw new ImageCompressError('Choose a JPG, PNG, or WebP image');
  }

  if ('size' in input && input.size > 20 * 1024 * 1024) {
    throw new ImageCompressError('Image must be under 20 MB');
  }

  const bitmap = await loadBitmap(input);
  try {
    const { width, height } = scaledSize(bitmap.width, bitmap.height, maxEdge);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new ImageCompressError('Canvas is unavailable');
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    let blob = await canvasToJpegBlob(canvas, quality);
    while (blob.size > maxBytes && quality > minQuality + 0.01) {
      quality = Math.max(minQuality, quality - 0.08);
      blob = await canvasToJpegBlob(canvas, quality);
    }

    const name =
      input instanceof File ? jpegFileName(input.name) : 'image.jpg';

    return new File([blob], name, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
