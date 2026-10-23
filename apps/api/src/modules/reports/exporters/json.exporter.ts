import { Injectable } from "@nestjs/common";
import { ReportDocument } from "../types/report-document";
import { ExportedReport, ReportExporter } from "./report-exporter";

// Structured copy of a report for viewing in the app. Only declared columns are
// returned, so internal row fields never leave the server.
@Injectable()
export class JsonExporter implements ReportExporter {
  readonly format = "json" as const;

  export(doc: ReportDocument): Promise<ExportedReport> {
    const body = {
      type: doc.type,
      title: doc.title,
      generatedAt: doc.generatedAt,
      letterhead: { clinicName: doc.letterhead.clinicName, timezone: doc.letterhead.timezone },
      summary: doc.summary ?? [],
      columns: doc.columns,
      rows: doc.rows.map((row) =>
        Object.fromEntries(doc.columns.map((column) => [column.key, row[column.key] ?? null])),
      ),
    };
    return Promise.resolve({
      buffer: Buffer.from(JSON.stringify(body), "utf8"),
      contentType: "application/json; charset=utf-8",
      filename: `${doc.filenameBase}.json`,
    });
  }
}
