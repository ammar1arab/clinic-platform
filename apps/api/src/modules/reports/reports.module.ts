import { Module } from "@nestjs/common";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { ReportsRepository } from "./reports.repository";
import { PdfExporter } from "./exporters/pdf.exporter";
import { CsvExporter } from "./exporters/csv.exporter";
import { ExcelExporter } from "./exporters/excel.exporter";
import { WordExporter } from "./exporters/word.exporter";
import { ReportExporterFactory } from "./exporters/report-exporter.factory";

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsRepository,
    ReportsService,
    PdfExporter,
    CsvExporter,
    ExcelExporter,
    WordExporter,
    ReportExporterFactory,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
