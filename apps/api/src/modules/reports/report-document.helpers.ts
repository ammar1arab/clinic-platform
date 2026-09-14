import { computePayable } from "@/modules/appointments/payable";
import { formatPhoneDisplay } from "@/infrastructure";
import { ReportDocument, ReportType } from "./types/report-document";
import { blank, slugFilename } from "./utils/report-format";

export type ClinicLetterheadRow = {
  name: string;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  letterheadFooter: string | null;
};

export function letterhead(clinic: ClinicLetterheadRow) {
  return {
    clinicName: clinic.name,
    address: clinic.address,
    phone: formatPhoneDisplay(clinic.phone) || clinic.phone,
    logoUrl: clinic.logoUrl,
    footer: clinic.letterheadFooter,
  };
}

export function reportDocument(input: {
  type: ReportType;
  title: string;
  filename: string[];
  clinic: ClinicLetterheadRow;
  summary?: Array<{ label: string; value: string }>;
  columns: ReportDocument["columns"];
  rows: ReportDocument["rows"];
}): ReportDocument {
  return {
    type: input.type,
    title: input.title,
    filenameBase: slugFilename(input.filename),
    generatedAt: new Date(),
    letterhead: letterhead(input.clinic),
    summary: input.summary,
    columns: input.columns,
    rows: input.rows,
  };
}

export function appointmentPerformance(rows: Array<{ status: string }>) {
  return {
    total: rows.length,
    completed: rows.filter((row) => row.status === "completed").length,
    noShows: rows.filter((row) => row.status === "no_show").length,
    cancelled: rows.filter((row) => row.status === "cancelled").length,
  };
}

export function moneyLine(
  fee: { toString(): string } | number | null | undefined,
  discount: { toString(): string } | number | null | undefined,
  discountType: string | null | undefined,
) {
  const baseFee = Number(fee ?? 0) || 0;
  const payable = computePayable(fee, discount, discountType);
  return {
    fee: Number(baseFee.toFixed(3)),
    discount: Number((baseFee - payable).toFixed(3)),
    payable: Number(payable.toFixed(3)),
  };
}

export function formatMoney(n: number) {
  return n.toFixed(3);
}

export function tally<T>(rows: T[], pick: (row: T) => [string, number] | null) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const entry = pick(row);
    if (!entry) continue;
    totals.set(entry[0], (totals.get(entry[0]) ?? 0) + entry[1]);
  }
  if (!totals.size) return blank(null);
  return [...totals.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([name, total]) => `${name}: ${formatMoney(total)}`)
    .join(" · ");
}
