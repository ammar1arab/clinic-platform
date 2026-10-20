import { readFile, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import sharp from "sharp";

const MAX_BYTES = 2 * 1024 * 1024;

export async function reportLogo(
  url?: string | null,
): Promise<Buffer | undefined> {
  if (!url) return;
  try {
    let data: Buffer;
    const embedded =
      /^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,([a-z0-9+/=\r\n]+)$/i.exec(
        url,
      );
    if (embedded) {
      if (embedded[2].length > (MAX_BYTES * 4) / 3 + 8) return;
      data = Buffer.from(embedded[2], "base64");
      if (
        embedded[1].toLowerCase() === "svg+xml" &&
        /<!DOCTYPE|<!ENTITY|href\s*=|url\s*\(/i.test(data.toString("utf8"))
      )
        return;
    } else if (/^\/(uploads|brand)\//.test(url)) {
      const root = resolve(process.env.WEB_PUBLIC_DIR ?? "../web/public");
      const path = resolve(root, `.${decodeURIComponent(url)}`);
      if (!path.startsWith(root + sep) || (await stat(path)).size > MAX_BYTES)
        return;
      data = await readFile(path);
    } else {
      const base = process.env.R2_PUBLIC_BASE_URL;
      if (!base) return;
      const target = new URL(url);
      const allowed = new URL(base.endsWith("/") ? base : base + "/");
      if (
        target.protocol !== "https:" ||
        target.origin !== allowed.origin ||
        !target.pathname.startsWith(allowed.pathname)
      )
        return;
      const response = await fetch(target, {
        redirect: "error",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok || !response.body) return;
      const chunks: Uint8Array[] = [];
      let size = 0;
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > MAX_BYTES) return;
        chunks.push(chunk);
      }
      data = Buffer.concat(chunks);
    }
    return await sharp(data, { limitInputPixels: 16_000_000 })
      .rotate()
      .resize(240, 120, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer();
  } catch {
    return;
  }
}
