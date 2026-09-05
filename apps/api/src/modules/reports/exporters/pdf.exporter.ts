import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { ReportDocument } from "../types/report-document";
import { ExportedReport, ReportExporter } from "./report-exporter";
import {
  REPORT_THEME,
  cellText,
  chunkColumns,
  letterheadLines,
  metaLine,
  proportionalWidths,
  useLandscape,
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

  private render(source: ReportDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const landscape = useLandscape(source.columns.length);
      const pdf = new PDFDocument({
        size: "A4",
        layout: landscape ? "landscape" : "portrait",
        margins: { top: 40, bottom: 48, left: 40, right: 40 },
        info: {
          Title: source.title,
          Author: source.letterhead.clinicName,
          Creator: "Cureva Clinic",
        },
      });

      const chunks: Buffer[] = [];
      pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdf.on("end", () => resolve(Buffer.concat(chunks)));
      pdf.on("error", reject);

      const parts = chunkColumns(source, landscape ? 8 : 6);
      parts.forEach((doc, partIndex) => {
        if (partIndex > 0) pdf.addPage();
        this.drawDocument(pdf, doc, partIndex === 0);
      });

      pdf.end();
    });
  }

  private drawDocument(
    pdf: PDFKit.PDFDocument,
    doc: ReportDocument,
    includeSummary: boolean,
  ) {
    const pageWidth =
      pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
    let y = pdf.page.margins.top;

    const head = letterheadLines(doc);
    pdf
      .fillColor(REPORT_THEME.ink)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(head[0] ?? doc.letterhead.clinicName, pdf.page.margins.left, y, {
        width: pageWidth,
        align: "center",
      });
    y = pdf.y + 2;

    if (head.length > 1) {
      pdf
        .fillColor(REPORT_THEME.muted)
        .font("Helvetica")
        .fontSize(9)
        .text(head.slice(1).join("  ·  "), pdf.page.margins.left, y, {
          width: pageWidth,
          align: "center",
        });
      y = pdf.y + 8;
    } else {
      y += 6;
    }

    pdf
      .strokeColor(REPORT_THEME.rule)
      .lineWidth(1)
      .moveTo(pdf.page.margins.left, y)
      .lineTo(pdf.page.margins.left + pageWidth, y)
      .stroke();
    y += 12;

    pdf
      .fillColor(REPORT_THEME.ink)
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(doc.title, pdf.page.margins.left, y, {
        width: pageWidth,
        align: "center",
      });
    y = pdf.y + 2;

    pdf
      .fillColor(REPORT_THEME.muted)
      .font("Helvetica")
      .fontSize(8)
      .text(metaLine(doc), pdf.page.margins.left, y, {
        width: pageWidth,
        align: "center",
      });
    y = pdf.y + 14;

    if (includeSummary && doc.summary?.length) {
      pdf
        .fillColor(REPORT_THEME.ink)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Summary", pdf.page.margins.left, y);
      y = pdf.y + 6;

      const colW = pageWidth / 2 - 10;
      for (let i = 0; i < doc.summary.length; i += 2) {
        const left = doc.summary[i];
        const right = doc.summary[i + 1];
        const rowY = y;
        this.drawSummaryItem(pdf, left, pdf.page.margins.left, rowY, colW);
        if (right) {
          this.drawSummaryItem(
            pdf,
            right,
            pdf.page.margins.left + colW + 20,
            rowY,
            colW,
          );
        }
        y = Math.max(pdf.y, rowY + 26) + 2;
      }
      y += 8;
    }

    const fractions = proportionalWidths(doc);
    const colWidths = fractions.map((f) => f * pageWidth);
    const fontSize =
      doc.columns.length >= 8 ? 6.5 : doc.columns.length >= 6 ? 7 : 8;
    const rowPad = 3;

    const drawHeader = () => {
      let x = pdf.page.margins.left;
      const headerH = 18;
      pdf.rect(x, y, pageWidth, headerH).fill(REPORT_THEME.headerBg);
      pdf
        .fillColor(REPORT_THEME.headerFg)
        .font("Helvetica-Bold")
        .fontSize(fontSize);
      doc.columns.forEach((col, i) => {
        pdf.text(col.header, x + rowPad, y + 5, {
          width: colWidths[i] - rowPad * 2,
          ellipsis: true,
        });
        x += colWidths[i];
      });
      y += headerH;
    };

    drawHeader();

    if (doc.rows.length === 0) {
      pdf
        .fillColor(REPORT_THEME.muted)
        .font("Helvetica-Oblique")
        .fontSize(8)
        .text("No records", pdf.page.margins.left, y + 8, {
          width: pageWidth,
          align: "center",
        });
      y += 28;
    } else {
      doc.rows.forEach((row, rowIndex) => {
        const values = doc.columns.map((c) => cellText(row[c.key]));
        const heights = values.map((text, i) =>
          pdf.heightOfString(text, {
            width: Math.max(colWidths[i] - rowPad * 2, 12),
          }),
        );
        const rowH = Math.max(16, Math.max(...heights) + rowPad * 2);

        if (y + rowH > pdf.page.height - pdf.page.margins.bottom - 36) {
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
          .lineWidth(0.4)
          .moveTo(pdf.page.margins.left, y + rowH)
          .lineTo(pdf.page.margins.left + pageWidth, y + rowH)
          .stroke();

        let x = pdf.page.margins.left;
        pdf.fillColor(REPORT_THEME.ink).font("Helvetica").fontSize(fontSize);
        values.forEach((text, i) => {
          pdf.text(text, x + rowPad, y + rowPad, {
            width: Math.max(colWidths[i] - rowPad * 2, 12),
          });
          x += colWidths[i];
        });
        y += rowH;
      });
    }

    this.drawFooter(pdf, doc);
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
      .fontSize(7)
      .text(item.label.toUpperCase(), x, y, { width });
    pdf
      .fillColor(REPORT_THEME.ink)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(item.value || "—", x, y + 10, { width });
  }

  private drawFooter(pdf: PDFKit.PDFDocument, doc: ReportDocument) {
    const bottom = pdf.page.height - 32;
    const width =
      pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
    pdf
      .strokeColor(REPORT_THEME.rule)
      .lineWidth(0.7)
      .moveTo(pdf.page.margins.left, bottom - 8)
      .lineTo(pdf.page.margins.left + width, bottom - 8)
      .stroke();

    const footer =
      doc.letterhead.footer?.trim() ||
      `${doc.letterhead.clinicName} · Confidential`;

    pdf
      .fillColor(REPORT_THEME.muted)
      .font("Helvetica")
      .fontSize(7)
      .text(footer, pdf.page.margins.left, bottom - 2, {
        width,
        align: "center",
      });
  }
}
