import { formatDisplayDateTime } from "./report-format";
import type { ReportDocument } from "../types/report-document";

export const REPORT_THEME = {
  ink: "#1E293B",
  muted: "#64748B",
  line: "#E2E8F0",
  headerBg: "#334155",
  headerFg: "#FFFFFF",
  stripe: "#F8FAFC",
  rule: "#CBD5E1",
} as const;

export function cellText(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function letterheadLines(doc: ReportDocument): string[] {
  const { letterhead } = doc;
  const lines: string[] = [letterhead.clinicName];
  if (letterhead.address) lines.push(letterhead.address);
  return lines;
}

export function metaLine(doc: ReportDocument): string {
  return `${doc.title}  ·  Generated ${formatDisplayDateTime(doc.generatedAt, doc.letterhead.timezone)}`;
}

export function csvPreface(doc: ReportDocument): string[] {
  const lines = [
    `# ${doc.letterhead.clinicName}`,
    `# ${doc.title}`,
    `# Generated ${formatDisplayDateTime(doc.generatedAt, doc.letterhead.timezone)}`,
  ];
  if (doc.letterhead.address)
    lines.push(`# Address: ${doc.letterhead.address}`);
  if (doc.summary?.length) {
    for (const item of doc.summary) {
      lines.push(`# ${item.label}: ${item.value}`);
    }
  }
  lines.push("#");
  return lines;
}

export function useLandscape(columnCount: number): boolean {
  return columnCount >= 7;
}

export function proportionalWidths(
  doc: ReportDocument,
  sampleRows = 12,
): number[] {
  const n = Math.max(doc.columns.length, 1);
  const weights = doc.columns.map((col) => {
    let maxLen = Math.max(col.header.length, 4);
    for (const row of doc.rows.slice(0, sampleRows)) {
      const raw = row[col.key];
      const len = raw == null ? 1 : String(raw).length;
      maxLen = Math.max(maxLen, Math.min(len, 28));
    }
    return maxLen;
  });
  const sum = weights.reduce((a, b) => a + b, 0) || n;
  return weights.map((w) => w / sum);
}

export function chunkColumns(
  doc: ReportDocument,
  maxCols = 6,
): ReportDocument[] {
  if (doc.columns.length <= maxCols) return [doc];

  const chunks: ReportDocument[] = [];
  for (let i = 0; i < doc.columns.length;) {
    const columns =
      i === 0
        ? doc.columns.slice(0, maxCols)
        : [doc.columns[0], ...doc.columns.slice(i, i + maxCols - 1)];
    i += i === 0 ? maxCols : maxCols - 1;
    const keys = new Set(columns.map((c) => c.key));
    chunks.push({
      ...doc,
      title:
        chunks.length === 0
          ? doc.title
          : `${doc.title} (continued ${chunks.length + 1})`,
      columns,
      rows: doc.rows.map((row) => {
        const next: Record<string, string | number | null> = {};
        for (const key of keys) next[key] = row[key] ?? null;
        return next;
      }),
      summary: chunks.length === 0 ? doc.summary : undefined,
    });
  }
  return chunks;
}

export function reportTheme(color?: string | null) {
  const accent = /^#[0-9a-f]{6}$/i.test(color ?? "") ? color! : "#2563EB";
  const rgb = [1, 3, 5].map((start) =>
    parseInt(accent.slice(start, start + 2), 16),
  );
  const luminance = rgb
    .map((value) => {
      const channel = value / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    })
    .reduce(
      (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
      0,
    );
  const stripe =
    "#" +
    rgb
      .map((value) =>
        Math.round(value * 0.05 + 255 * 0.95)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  return {
    ...REPORT_THEME,
    headerBg: accent,
    headerFg: luminance > 0.179 ? "#111827" : "#FFFFFF",
    rule: accent,
    stripe,
  };
}
