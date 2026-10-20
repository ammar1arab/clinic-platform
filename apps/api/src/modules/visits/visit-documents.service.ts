import { Injectable } from "@nestjs/common";
import { PdfExporter } from "../reports/exporters/pdf.exporter";

export interface VisitDocumentSnapshot {
  title: string;
  clinicName: string;
  logoUrl?: string | null;
  brandColor?: string | null;
  footer?: string | null;
  patientName: string;
  practitionerName: string;
  issuedAt: string;
  timezone: string;
  sections: { label: string; value: string }[];
}

@Injectable()
export class VisitDocumentsService {
  private readonly exporter = new PdfExporter();

  async render(snapshot: VisitDocumentSnapshot): Promise<Buffer> {
    const report = await this.exporter.export({
      type: "patient_medical",
      title: snapshot.title,
      filenameBase: "visit-document",
      generatedAt: new Date(snapshot.issuedAt),
      letterhead: {
        clinicName: snapshot.clinicName,
        logoUrl: snapshot.logoUrl,
        brandColor: snapshot.brandColor,
        footer: snapshot.footer,
        timezone: snapshot.timezone,
      },
      summary: [
        { label: "Patient / المريض", value: snapshot.patientName },
        { label: "Practitioner / الطبيب", value: snapshot.practitionerName },
      ],
      columns: [
        { key: "label", header: "Section / القسم" },
        { key: "value", header: "Details / التفاصيل" },
      ],
      rows: snapshot.sections.map((section) => ({
        label: section.label,
        value: section.value,
      })),
    });
    return report.buffer;
  }
}
