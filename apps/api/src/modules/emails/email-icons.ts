import { deflateSync } from "node:zlib";

const SIZE = 40;
const STROKE = (2 * SIZE) / 24;

type Point = [number, number];

const at = (n: number) => (n / 24) * SIZE;

function crc32(data: Buffer) {
  let crc = ~0;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type: string, data: Buffer) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])));
  return Buffer.concat([head, data, crc]);
}

function pngDataUrl(rgba: Buffer) {
  const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
  for (let y = 0; y < SIZE; y += 1) {
    rgba.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(SIZE, 0);
  header.writeUInt32BE(SIZE, 4);
  header[8] = 8;
  header[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString("base64")}`;
}

function segmentDistance(x: number, y: number, a: Point, b: Point) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = dx * dx + dy * dy;
  const t =
    length === 0
      ? 0
      : Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / length));
  return Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy));
}

function stroke(parts: Point[][]) {
  return (x: number, y: number) => {
    let nearest = STROKE;
    for (const part of parts) {
      for (let index = 1; index < part.length; index += 1) {
        nearest = Math.min(
          nearest,
          segmentDistance(x, y, part[index - 1], part[index]),
        );
      }
    }
    return nearest;
  };
}

function arc(cx: number, cy: number, radius: number, start: number, end: number) {
  const steps = 18;
  const points: Point[] = [];
  for (let step = 0; step <= steps; step += 1) {
    const angle = start + ((end - start) * step) / steps;
    points.push([
      at(cx) + at(radius) * Math.cos(angle),
      at(cy) + at(radius) * Math.sin(angle),
    ]);
  }
  return points;
}

function line(x1: number, y1: number, x2: number, y2: number): Point[] {
  return [
    [at(x1), at(y1)],
    [at(x2), at(y2)],
  ];
}

function circle(cx: number, cy: number, radius: number) {
  return arc(cx, cy, radius, 0, Math.PI * 2);
}

function ellipse(cx: number, cy: number, rx: number, ry: number) {
  const steps = 36;
  const points: Point[] = [];
  for (let step = 0; step <= steps; step += 1) {
    const angle = (Math.PI * 2 * step) / steps;
    points.push([
      at(cx) + at(rx) * Math.cos(angle),
      at(cy) + at(ry) * Math.sin(angle),
    ]);
  }
  return points;
}

function roundRect(x: number, y: number, width: number, height: number, radius: number) {
  const right = x + width;
  const bottom = y + height;
  return [
    ...arc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5),
    ...line(x + radius, y, right - radius, y).slice(1),
    ...arc(right - radius, y + radius, radius, -Math.PI / 2, 0).slice(1),
    ...line(right, y + radius, right, bottom - radius).slice(1),
    ...arc(right - radius, bottom - radius, radius, 0, Math.PI / 2).slice(1),
    ...line(right - radius, bottom, x + radius, bottom).slice(1),
    ...arc(x + radius, bottom - radius, radius, Math.PI / 2, Math.PI).slice(1),
    ...line(x, bottom - radius, x, y + radius).slice(1),
  ];
}

const ICONS: Record<string, Point[][]> = {
  website: [circle(12, 12, 10), ellipse(12, 12, 5.2, 10), line(2, 12, 22, 12)],
  instagram: [
    roundRect(2, 2, 20, 20, 5),
    circle(12.3, 12.3, 4),
    circle(17.5, 6.5, 0.9),
  ],
  facebook: [
    [
      ...line(18, 2, 15, 2),
      ...arc(15, 7, 5, -Math.PI / 2, -Math.PI).slice(1),
      ...line(10, 7, 10, 10).slice(1),
      ...line(10, 10, 7, 10).slice(1),
      ...line(7, 10, 7, 14).slice(1),
      ...line(7, 14, 10, 14).slice(1),
      ...line(10, 14, 10, 22).slice(1),
      ...line(10, 22, 14, 22).slice(1),
      ...line(14, 22, 14, 14).slice(1),
      ...line(14, 14, 17, 14).slice(1),
      ...line(17, 14, 18, 10).slice(1),
      ...line(18, 10, 14, 10).slice(1),
      ...line(14, 10, 14, 7).slice(1),
      ...line(14, 7, 15, 6).slice(1),
      ...line(15, 6, 18, 6).slice(1),
      ...line(18, 6, 18, 2).slice(1),
    ],
  ],
  linkedin: [
    circle(4, 4, 2),
    [
      ...line(2, 9, 6, 9),
      ...line(6, 9, 6, 21).slice(1),
      ...line(6, 21, 2, 21).slice(1),
      ...line(2, 21, 2, 9).slice(1),
    ],
    [
      ...arc(16, 14, 6, -Math.PI / 2, 0),
      ...line(22, 14, 22, 21).slice(1),
      ...line(22, 21, 18, 21).slice(1),
      ...line(18, 21, 18, 14).slice(1),
      ...arc(16, 12, 2, Math.PI / 2, Math.PI).slice(1),
      ...arc(16, 12, 2, Math.PI, Math.PI * 1.5).slice(1),
      ...line(14, 14, 14, 21).slice(1),
      ...line(14, 21, 10, 21).slice(1),
      ...line(10, 21, 10, 14).slice(1),
      ...arc(16, 14, 6, Math.PI, Math.PI * 1.5).slice(1),
    ],
  ],
};

function channels(accent: string) {
  return [
    Number.parseInt(accent.slice(1, 3), 16),
    Number.parseInt(accent.slice(3, 5), 16),
    Number.parseInt(accent.slice(5, 7), 16),
  ];
}

export function emailIcon(id: keyof typeof ICONS, accent: string) {
  const [red, green, blue] = channels(accent);
  const distance = stroke(ICONS[id]);
  const rgba = Buffer.alloc(SIZE * SIZE * 4);
  const half = STROKE / 2;
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const gap = distance(x + 0.5, y + 0.5);
      const alpha =
        gap <= half ? 255 : gap <= half + 0.85 ? Math.round(255 * (1 - (gap - half) / 0.85)) : 0;
      if (!alpha) continue;
      const offset = (y * SIZE + x) * 4;
      rgba[offset] = red;
      rgba[offset + 1] = green;
      rgba[offset + 2] = blue;
      rgba[offset + 3] = alpha;
    }
  }
  return pngDataUrl(rgba);
}
