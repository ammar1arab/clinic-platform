import { Module } from "@nestjs/common";
import { AppointmentsModule } from "@/modules/appointments/appointments.module";
import { PatientsModule } from "@/modules/patients/patients.module";
import { PractitionersModule } from "@/modules/practitioners/practitioners.module";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { ReportsRepository } from "./reports.repository";
import { PdfExporter } from "./exporters/pdf.exporter";
import { CsvExporter } from "./exporters/csv.exporter";
import { ExcelExporter } from "./exporters/excel.exporter";
import { WordExporter } from "./exporters/word.exporter";
import { ReportExporterFactory } from "./exporters/report-exporter.factory";

@Module({
  imports: [PatientsModule, PractitionersModule, AppointmentsModule],
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
