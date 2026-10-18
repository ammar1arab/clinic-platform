import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { join } from "node:path";
export interface VisitDocumentSnapshot {
  title: string;
  clinicName: string;
  patientName: string;
  practitionerName: string;
  issuedAt: string;
  timezone: string;
  sections: { label: string; value: string }[];
}
@Injectable()
export class VisitDocumentsService {
  render(snapshot: VisitDocumentSnapshot): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({
        size: "A4",
        margin: 42,
        info: {
          Title: snapshot.title,
          Author: snapshot.clinicName,
          CreationDate: new Date(snapshot.issuedAt),
        },
      });
      const chunks: Buffer[] = [];
      pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdf.on("error", reject);
      pdf.on("end", () => resolve(Buffer.concat(chunks)));
      pdf.font(join(__dirname, "assets", "DejaVuSans.ttf"));
      const write = (value: string, size: number) => {
        const arabic = /[\u0600-\u06ff]/.test(value);
        pdf.fontSize(size).text(value, {
          align: arabic ? "right" : "left",
          features: ["rlig", "liga"],
        });
      };
      write(snapshot.clinicName, 17);
      pdf.moveDown(0.4);
      write(snapshot.title, 14);
      write(`${snapshot.patientName} | ${snapshot.practitionerName}`, 10);
      let date: string;
      try {
        date = new Intl.DateTimeFormat("en-GB", {
          timeZone: snapshot.timezone,
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(snapshot.issuedAt));
      } catch {
        date = new Date(snapshot.issuedAt).toISOString();
      }
      write(date, 9);
      for (const section of snapshot.sections) {
        pdf.moveDown(0.6);
        write(section.label, 11);
        write(section.value || "-", 10);
      }
      pdf.end();
    });
  }
}
