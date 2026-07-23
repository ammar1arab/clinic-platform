import { Injectable } from "@nestjs/common";
import { ReportDocument } from "../types/report-document";
import { ExportedReport, ReportExporter } from "./report-exporter";
import { escapeXml, formatDisplayDate } from "../utils/report-format";
import { REPORT_THEME, letterheadLines } from "../utils/report-theme";

/**
 * SpreadsheetML (.xls) — opens in Excel / LibreOffice without native deps.
 */
@Injectable()
export class ExcelExporter implements ReportExporter {
  readonly format = "xlsx" as const;

  export(doc: ReportDocument): Promise<ExportedReport> {
    const headerCells = doc.columns
      .map(
        (c) =>
          `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(c.header)}</Data></Cell>`,
      )
      .join("");

    const dataRows =
      doc.rows.length === 0
        ? `<Row><Cell ss:StyleID="Muted"><Data ss:Type="String">No records</Data></Cell></Row>`
        : doc.rows
            .map((row, index) => {
              const style = index % 2 === 1 ? ' ss:StyleID="Stripe"' : "";
              const cells = doc.columns
                .map((c) => {
                  const raw = row[c.key];
                  if (typeof raw === "number" && Number.isFinite(raw)) {
                    return `<Cell${style}><Data ss:Type="Number">${raw}</Data></Cell>`;
                  }
                  const text =
                    raw === null || raw === undefined ? "" : String(raw);
                  return `<Cell${style}><Data ss:Type="String">${escapeXml(text)}</Data></Cell>`;
                })
                .join("");
              return `<Row>${cells}</Row>`;
            })
            .join("");

    const head = letterheadLines(doc);
    const letterheadRows = head
      .map(
        (line, i) =>
          `<Row><Cell ss:StyleID="${i === 0 ? "Clinic" : "Muted"}"><Data ss:Type="String">${escapeXml(line)}</Data></Cell></Row>`,
      )
      .join("");

    const summaryRows =
      doc.summary
        ?.map(
          (s) =>
            `<Row><Cell ss:StyleID="Label"><Data ss:Type="String">${escapeXml(s.label)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(s.value)}</Data></Cell></Row>`,
        )
        .join("") ?? "";

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Clinic">
      <Font ss:Bold="1" ss:Size="14" ss:Color="${REPORT_THEME.ink}"/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:Bold="1" ss:Size="12" ss:Color="${REPORT_THEME.ink}"/>
    </Style>
    <Style ss:ID="Muted">
      <Font ss:Size="9" ss:Color="${REPORT_THEME.muted}"/>
    </Style>
    <Style ss:ID="Label">
      <Font ss:Bold="1" ss:Size="9" ss:Color="${REPORT_THEME.muted}"/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="${REPORT_THEME.headerFg}"/>
      <Interior ss:Color="${REPORT_THEME.headerBg}" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Stripe">
      <Interior ss:Color="${REPORT_THEME.stripe}" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Report">
    <Table>
      ${letterheadRows}
      <Row><Cell ss:StyleID="Title"><Data ss:Type="String">${escapeXml(doc.title)}</Data></Cell></Row>
      <Row><Cell ss:StyleID="Muted"><Data ss:Type="String">Generated ${escapeXml(formatDisplayDate(doc.generatedAt))}</Data></Cell></Row>
      <Row></Row>
      ${summaryRows}
      ${summaryRows ? "<Row></Row>" : ""}
      <Row>${headerCells}</Row>
      ${dataRows}
      <Row></Row>
      <Row><Cell ss:StyleID="Muted"><Data ss:Type="String">${escapeXml(doc.letterhead.footer?.trim() || `${doc.letterhead.clinicName} · Confidential clinical report`)}</Data></Cell></Row>
    </Table>
  </Worksheet>
</Workbook>`;

    return Promise.resolve({
      buffer: Buffer.from(xml, "utf8"),
      contentType: "application/vnd.ms-excel",
      filename: `${doc.filenameBase}.xls`,
    });
  }
}
