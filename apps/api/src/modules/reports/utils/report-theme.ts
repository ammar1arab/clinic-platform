import { formatDisplayDate } from "./report-format";
import { formatPhoneDisplay } from "@/infrastructure";
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
  if (letterhead.phone) {
    lines.push(formatPhoneDisplay(letterhead.phone) || letterhead.phone);
  }
  return lines;
}

export function metaLine(doc: ReportDocument): string {
  return `${doc.title}  ·  Generated ${formatDisplayDate(doc.generatedAt)}`;
}

export function csvPreface(doc: ReportDocument): string[] {
  const lines = [
    `# ${doc.letterhead.clinicName}`,
    `# ${doc.title}`,
    `# Generated ${formatDisplayDate(doc.generatedAt)}`,
  ];
  if (doc.letterhead.address) lines.push(`# Address: ${doc.letterhead.address}`);
  if (doc.letterhead.phone) {
    lines.push(
      `# Phone: ${formatPhoneDisplay(doc.letterhead.phone) || doc.letterhead.phone}`,
    );
  }
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


export function chunkColumns(doc: ReportDocument, maxCols = 6): ReportDocument[] {
  if (doc.columns.length <= maxCols) return [doc];

  const chunks: ReportDocument[] = [];
  for (let i = 0; i < doc.columns.length; i += maxCols) {
    const columns = doc.columns.slice(i, i + maxCols);
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
      summary: i === 0 ? doc.summary : undefined,
    });
  }
  return chunks;
}
