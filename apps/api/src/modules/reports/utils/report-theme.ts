import { formatDisplayDate } from "./report-format";
import type { ReportDocument } from "../types/report-document";

/** Shared visual tokens so PDF / Word / Excel / CSV feel like one product. */
export const REPORT_THEME = {
  ink: "#0F172A",
  muted: "#64748B",
  line: "#CBD5E1",
  headerBg: "#0F766E",
  headerFg: "#FFFFFF",
  stripe: "#F8FAFC",
  accent: "#0D9488",
} as const;

export function cellText(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function letterheadLines(doc: ReportDocument): string[] {
  const { letterhead } = doc;
  const lines: string[] = [letterhead.clinicName];
  if (letterhead.address) lines.push(letterhead.address);
  if (letterhead.phone) lines.push(letterhead.phone);
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
  if (doc.letterhead.phone) lines.push(`# Phone: ${doc.letterhead.phone}`);
  if (doc.summary?.length) {
    for (const item of doc.summary) {
      lines.push(`# ${item.label}: ${item.value}`);
    }
  }
  lines.push("#");
  return lines;
}
