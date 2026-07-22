import { Injectable } from '@nestjs/common';
import { ReportDocument } from '../types/report-document';
import { ExportedReport, ReportExporter } from './report-exporter';
import { escapeXml, formatDisplayDate } from '../utils/report-format';

/**
 * SpreadsheetML (.xlsx-compatible via Excel XML).
 * Opens in Excel / LibreOffice without extra native deps.
 */
@Injectable()
export class ExcelExporter implements ReportExporter {
  readonly format = 'xlsx' as const;

  async export(doc: ReportDocument): Promise<ExportedReport> {
    const headerCells = doc.columns
      .map((c) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(c.header)}</Data></Cell>`)
      .join('');

    const dataRows =
      doc.rows.length === 0
        ? `<Row><Cell><Data ss:Type="String">No records</Data></Cell></Row>`
        : doc.rows
            .map((row) => {
              const cells = doc.columns
                .map((c) => {
                  const raw = row[c.key];
                  if (typeof raw === 'number' && Number.isFinite(raw)) {
                    return `<Cell><Data ss:Type="Number">${raw}</Data></Cell>`;
                  }
                  const text =
                    raw === null || raw === undefined ? '' : String(raw);
                  return `<Cell><Data ss:Type="String">${escapeXml(text)}</Data></Cell>`;
                })
                .join('');
              return `<Row>${cells}</Row>`;
            })
            .join('');

    const summaryRows =
      doc.summary
        ?.map(
          (s) =>
            `<Row><Cell><Data ss:Type="String">${escapeXml(s.label)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(s.value)}</Data></Cell></Row>`,
        )
        .join('') ?? '';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#F5F5F5" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Report">
    <Table>
      <Row><Cell><Data ss:Type="String">${escapeXml(doc.letterhead.clinicName)}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">${escapeXml(doc.title)}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Generated ${escapeXml(formatDisplayDate(doc.generatedAt))}</Data></Cell></Row>
      <Row></Row>
      ${summaryRows}
      ${summaryRows ? '<Row></Row>' : ''}
      <Row>${headerCells}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;

    return {
      buffer: Buffer.from(xml, 'utf8'),
      // Excel opens SpreadsheetML; .xls keeps widest compatibility without exceljs
      contentType: 'application/vnd.ms-excel',
      filename: `${doc.filenameBase}.xls`,
    };
  }
}
