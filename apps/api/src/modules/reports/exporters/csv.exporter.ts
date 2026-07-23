import { Injectable } from "@nestjs/common";
import { ReportDocument } from "../types/report-document";
import { ExportedReport, ReportExporter } from "./report-exporter";
import { csvPreface } from "../utils/report-theme";

@Injectable()
export class CsvExporter implements ReportExporter {
  readonly format = "csv" as const;

  export(doc: ReportDocument): Promise<ExportedReport> {
    const lines: string[] = [...csvPreface(doc)];

    lines.push(this.row(doc.columns.map((c) => c.header)));

    for (const row of doc.rows) {
      lines.push(
        this.row(
          doc.columns.map((c) => {
            const raw = row[c.key];
            return raw === null || raw === undefined ? "" : String(raw);
          }),
        ),
      );
    }

    const csv = `\uFEFF${lines.join("\r\n")}`;
    return Promise.resolve({
      buffer: Buffer.from(csv, "utf8"),
      contentType: "text/csv; charset=utf-8",
      filename: `${doc.filenameBase}.csv`,
    });
  }

  private row(cells: string[]): string {
    return cells.map((c) => this.escape(c)).join(",");
  }

  private escape(value: string): string {
    if (/[",\r\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
