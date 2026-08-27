import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const outDir = path.join(publicDir, 'avatars');
fs.mkdirSync(outDir, { recursive: true });

const files = fs
  .readdirSync(publicDir)
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith('avatar'))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const WHITE = 248;

async function toTransparentSquare(inputPath) {
  const base = sharp(inputPath).rotate().resize(512, 512, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  const { data, info } = await base
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r >= WHITE && g >= WHITE && b >= WHITE) data[i + 3] = 0;
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).webp({ quality: 90, alphaQuality: 100 });
}

let n = 0;
for (const file of files) {
  n += 1;
  const out = path.join(outDir, `avatar-${n}.webp`);
  await (await toTransparentSquare(path.join(publicDir, file))).toFile(out);
  console.log(`${n} ${file} -> avatar-${n}.webp`);
}

fs.writeFileSync(path.join(outDir, 'count.json'), JSON.stringify({ count: n }));
console.log('TOTAL', n);
