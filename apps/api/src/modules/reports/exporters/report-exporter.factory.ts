import { Injectable } from '@nestjs/common';
import { ReportFormat } from '../types/report-document';
import { ReportExporter, ExportedReport } from './report-exporter';
import { PdfExporter } from './pdf.exporter';
import { CsvExporter } from './csv.exporter';
import { ExcelExporter } from './excel.exporter';
import { ReportDocument } from '../types/report-document';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class ReportExporterFactory {
  private readonly exporters: Map<ReportFormat, ReportExporter>;

  constructor(
    pdf: PdfExporter,
    csv: CsvExporter,
    excel: ExcelExporter,
  ) {
    this.exporters = new Map<ReportFormat, ReportExporter>([
      [pdf.format, pdf],
      [csv.format, csv],
      [excel.format, excel],
    ]);
  }

  async export(doc: ReportDocument, format: ReportFormat): Promise<ExportedReport> {
    const exporter = this.exporters.get(format);
    if (!exporter) {
      throw new BadRequestException(`Unsupported report format: ${format}`);
    }
    return exporter.export(doc);
  }
}
