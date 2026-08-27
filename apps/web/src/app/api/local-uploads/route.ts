import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(['practitioners']);

function isLocalUploadAllowed(): boolean {
  if (process.env.ALLOW_LOCAL_UPLOADS === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

export async function POST(request: Request) {
  if (!isLocalUploadAllowed()) {
    return Response.json(
      { message: 'Local image uploads are disabled outside development' },
      { status: 403 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ message: 'Invalid upload payload' }, { status: 400 });
  }

  const file = form.get('file');
  const folderRaw = String(form.get('folder') ?? 'practitioners');
  const folder = ALLOWED_FOLDERS.has(folderRaw) ? folderRaw : null;

  if (!folder) {
    return Response.json({ message: 'Invalid upload folder' }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return Response.json({ message: 'Missing image file' }, { status: 400 });
  }

  if (file.type !== 'image/jpeg') {
    return Response.json(
      { message: 'Only JPEG images are accepted after compression' },
      { status: 400 },
    );
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return Response.json(
      { message: 'Image is empty or still too large after compression' },
      { status: 400 },
    );
  }

  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.jpg`;
  const dir = path.join(process.cwd(), 'public', 'uploads', folder);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const url = `/uploads/${folder}/${filename}`;
  return Response.json({ url, filename });
}
