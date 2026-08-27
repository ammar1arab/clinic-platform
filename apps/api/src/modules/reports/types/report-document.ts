export type ReportFormat = "pdf" | "xlsx" | "csv" | "docx";

export type ReportType = "patient_medical" | "referrals" | "finance_monthly";

export interface ReportColumn {
  key: string;
  header: string;
}

export interface ReportDocument {
  type: ReportType;
  title: string;
  filenameBase: string;
  generatedAt: Date;
  letterhead: {
    clinicName: string;
    address?: string | null;
    phone?: string | null;
    logoUrl?: string | null;
    footer?: string | null;
  };

  summary?: Array<{ label: string; value: string }>;
  columns: ReportColumn[];
  rows: Array<Record<string, string | number | null>>;
}
