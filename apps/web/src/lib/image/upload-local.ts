import { compressImageToJpeg, type CompressToJpegOptions } from './compress-to-jpeg';

export type LocalUploadResult = {
  /** Public path under /uploads/… for temp local testing. */
  url: string;
  filename: string;
};

/**
 * Compress to JPEG then POST to the local Next upload route.
 * Writes under `public/uploads/` for temporary testing until R2 (or similar).
 */
export async function uploadCompressedLocalImage(
  input: File | Blob,
  options?: CompressToJpegOptions & { folder?: string },
): Promise<LocalUploadResult> {
  const jpeg = await compressImageToJpeg(input, options);
  const folder = options?.folder ?? 'practitioners';

  const body = new FormData();
  body.append('file', jpeg);
  body.append('folder', folder);

  const res = await fetch('/api/local-uploads', {
    method: 'POST',
    body,
  });

  if (!res.ok) {
    let message = 'Could not save image';
    try {
      const data = (await res.json()) as { message?: string };
      if (data.message) message = data.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return (await res.json()) as LocalUploadResult;
}

export { compressImageToJpeg, ImageCompressError } from './compress-to-jpeg';
export type { CompressToJpegOptions } from './compress-to-jpeg';
