import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { ReportDocument } from "../types/report-document";
import { ExportedReport, ReportExporter } from "./report-exporter";
import {
  REPORT_THEME,
  cellText,
  letterheadLines,
  metaLine,
} from "../utils/report-theme";

@Injectable()
export class PdfExporter implements ReportExporter {
  readonly format = "pdf" as const;

  async export(doc: ReportDocument): Promise<ExportedReport> {
    const buffer = await this.render(doc);
    return {
      buffer,
      contentType: "application/pdf",
      filename: `${doc.filenameBase}.pdf`,
    };
  }

  private render(doc: ReportDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({
        size: "A4",
        margins: { top: 48, bottom: 56, left: 48, right: 48 },
        info: {
          Title: doc.title,
          Author: doc.letterhead.clinicName,
          Creator: "Cureva Clinic Platform",
        },
      });

      const chunks: Buffer[] = [];
      pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdf.on("end", () => resolve(Buffer.concat(chunks)));
      pdf.on("error", reject);

      const pageWidth =
        pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
      let y = pdf.page.margins.top;

      // Letterhead
      const head = letterheadLines(doc);
      pdf
        .fillColor(REPORT_THEME.ink)
        .font("Helvetica-Bold")
        .fontSize(18)
        .text(head[0] ?? doc.letterhead.clinicName, pdf.page.margins.left, y, {
          width: pageWidth,
        });
      y = pdf.y + 4;

      if (head.length > 1) {
        pdf
          .fillColor(REPORT_THEME.muted)
          .font("Helvetica")
          .fontSize(9)
          .text(head.slice(1).join("  ·  "), pdf.page.margins.left, y, {
            width: pageWidth,
          });
        y = pdf.y + 10;
      } else {
        y += 8;
      }

      pdf
        .strokeColor(REPORT_THEME.accent)
        .lineWidth(2)
        .moveTo(pdf.page.margins.left, y)
        .lineTo(pdf.page.margins.left + pageWidth, y)
        .stroke();
      y += 14;

      pdf
        .fillColor(REPORT_THEME.ink)
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(doc.title, pdf.page.margins.left, y, { width: pageWidth });
      y = pdf.y + 2;

      pdf
        .fillColor(REPORT_THEME.muted)
        .font("Helvetica")
        .fontSize(9)
        .text(metaLine(doc), pdf.page.margins.left, y, { width: pageWidth });
      y = pdf.y + 16;

      // Summary
      if (doc.summary?.length) {
        pdf
          .fillColor(REPORT_THEME.ink)
          .font("Helvetica-Bold")
          .fontSize(11)
          .text("Summary", pdf.page.margins.left, y);
        y = pdf.y + 8;

        const colW = pageWidth / 2 - 8;
        for (let i = 0; i < doc.summary.length; i += 2) {
          const left = doc.summary[i];
          const right = doc.summary[i + 1];
          const rowY = y;

          this.drawSummaryItem(pdf, left, pdf.page.margins.left, rowY, colW);
          if (right) {
            this.drawSummaryItem(
              pdf,
              right,
              pdf.page.margins.left + colW + 16,
              rowY,
              colW,
            );
          }
          y = Math.max(pdf.y, rowY + 28) + 4;
          this.ensureSpace(pdf, y, 40);
          y = Math.max(y, pdf.y);
        }
        y += 8;
      }

      // Table
      pdf
        .fillColor(REPORT_THEME.ink)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Records", pdf.page.margins.left, y);
      y = pdf.y + 8;

      const colCount = Math.max(doc.columns.length, 1);
      const colWidths = this.columnWidths(doc, pageWidth);
      const rowPad = 5;

      const drawHeader = () => {
        let x = pdf.page.margins.left;
        const headerH = 22;
        pdf
          .rect(x, y, pageWidth, headerH)
          .fill(REPORT_THEME.headerBg);

        pdf.fillColor(REPORT_THEME.headerFg).font("Helvetica-Bold").fontSize(8);
        for (let i = 0; i < colCount; i++) {
          const col = doc.columns[i];
          pdf.text(col?.header ?? "", x + rowPad, y + 7, {
            width: colWidths[i] - rowPad * 2,
            ellipsis: true,
          });
          x += colWidths[i];
        }
        y += headerH;
      };

      drawHeader();

      if (doc.rows.length === 0) {
        this.ensureSpace(pdf, y, 28);
        pdf
          .fillColor(REPORT_THEME.muted)
          .font("Helvetica-Oblique")
          .fontSize(9)
          .text("No records", pdf.page.margins.left + rowPad, y + 8, {
            width: pageWidth - rowPad * 2,
          });
        y += 28;
      } else {
        doc.rows.forEach((row, rowIndex) => {
          const values = doc.columns.map((c) => cellText(row[c.key]));
          const heights = values.map((text, i) =>
            pdf.heightOfString(text, {
              width: colWidths[i] - rowPad * 2,
              align: "left",
            }),
          );
          const rowH = Math.max(18, Math.max(...heights) + rowPad * 2);

          if (y + rowH > pdf.page.height - pdf.page.margins.bottom - 40) {
            this.drawFooter(pdf, doc);
            pdf.addPage();
            y = pdf.page.margins.top;
            drawHeader();
          }

          if (rowIndex % 2 === 1) {
            pdf
              .rect(pdf.page.margins.left, y, pageWidth, rowH)
              .fill(REPORT_THEME.stripe);
          }

          pdf
            .strokeColor(REPORT_THEME.line)
            .lineWidth(0.5)
            .moveTo(pdf.page.margins.left, y + rowH)
            .lineTo(pdf.page.margins.left + pageWidth, y + rowH)
            .stroke();

          let x = pdf.page.margins.left;
          pdf.fillColor(REPORT_THEME.ink).font("Helvetica").fontSize(8);
          values.forEach((text, i) => {
            pdf.text(text, x + rowPad, y + rowPad, {
              width: colWidths[i] - rowPad * 2,
            });
            x += colWidths[i];
          });
          y += rowH;
        });
      }

      this.drawFooter(pdf, doc);
      pdf.end();
    });
  }

  private drawSummaryItem(
    pdf: PDFKit.PDFDocument,
    item: { label: string; value: string },
    x: number,
    y: number,
    width: number,
  ) {
    pdf
      .fillColor(REPORT_THEME.muted)
      .font("Helvetica")
      .fontSize(8)
      .text(item.label.toUpperCase(), x, y, { width });
    pdf
      .fillColor(REPORT_THEME.ink)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(item.value || "—", x, y + 11, { width });
  }

  private columnWidths(doc: ReportDocument, pageWidth: number): number[] {
    const n = Math.max(doc.columns.length, 1);
    const base = pageWidth / n;
    return doc.columns.map(() => base);
  }

  private ensureSpace(pdf: PDFKit.PDFDocument, y: number, needed: number) {
    if (y + needed > pdf.page.height - pdf.page.margins.bottom) {
      pdf.addPage();
    }
  }

  private drawFooter(pdf: PDFKit.PDFDocument, doc: ReportDocument) {
    const bottom = pdf.page.height - 36;
    pdf
      .strokeColor(REPORT_THEME.line)
      .lineWidth(0.8)
      .moveTo(pdf.page.margins.left, bottom - 10)
      .lineTo(pdf.page.width - pdf.page.margins.right, bottom - 10)
      .stroke();

    const footer =
      doc.letterhead.footer?.trim() ||
      `${doc.letterhead.clinicName} · Confidential clinical report`;

    pdf
      .fillColor(REPORT_THEME.muted)
      .font("Helvetica")
      .fontSize(8)
      .text(footer, pdf.page.margins.left, bottom - 4, {
        width: pdf.page.width - pdf.page.margins.left - pdf.page.margins.right,
        align: "center",
      });
  }
}
