import { ReportDocument, ReportFormat } from "../types/report-document";

export interface ExportedReport {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

export interface ReportExporter {
  readonly format: ReportFormat;
  export(doc: ReportDocument): Promise<ExportedReport>;
}
