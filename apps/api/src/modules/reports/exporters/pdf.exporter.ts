import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { join } from "node:path";
import { reportLogo } from "../utils/report-logo";
import { ReportDocument } from "../types/report-document";
import { ExportedReport, ReportExporter } from "./report-exporter";
import {
  reportTheme,
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
    const buffer = await this.render(
      doc,
      await reportLogo(doc.letterhead.logoUrl),
    );
    return {
      buffer,
      contentType: "application/pdf",
      filename: `${doc.filenameBase}.pdf`,
    };
  }

  private render(source: ReportDocument, logo?: Buffer): Promise<Buffer> {
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

      pdf.registerFont(
        "Report",
        join(__dirname, "../../visits/assets/DejaVuSans.ttf"),
      );
      const parts = chunkColumns(source, landscape ? 8 : 6);
      parts.forEach((doc, partIndex) => {
        if (partIndex > 0) pdf.addPage();
        this.drawDocument(pdf, doc, partIndex === 0, logo);
      });

      pdf.end();
    });
  }

  private drawDocument(
    pdf: PDFKit.PDFDocument,
    doc: ReportDocument,
    includeSummary: boolean,
    logo?: Buffer,
  ) {
    const theme = reportTheme(doc.letterhead.brandColor);
    const pageWidth =
      pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
    let y = pdf.page.margins.top;

    if (logo) {
      pdf.image(logo, pdf.page.margins.left + pageWidth / 2 - 40, y, {
        fit: [80, 40],
        align: "center",
        valign: "center",
      });
      y += 48;
    }
    const head = letterheadLines(doc);
    pdf
      .fillColor(theme.ink)
      .font("Report")
      .fontSize(16)
      .text(head[0] ?? doc.letterhead.clinicName, pdf.page.margins.left, y, {
        width: pageWidth,
        align: "center",
      });
    y = pdf.y + 2;

    if (head.length > 1) {
      pdf
        .fillColor(theme.muted)
        .font("Report")
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
      .strokeColor(theme.rule)
      .lineWidth(1)
      .moveTo(pdf.page.margins.left, y)
      .lineTo(pdf.page.margins.left + pageWidth, y)
      .stroke();
    y += 12;

    pdf
      .fillColor(theme.ink)
      .font("Report")
      .fontSize(12)
      .text(doc.title, pdf.page.margins.left, y, {
        width: pageWidth,
        align: "center",
      });
    y = pdf.y + 2;

    pdf
      .fillColor(theme.muted)
      .font("Report")
      .fontSize(8)
      .text(metaLine(doc), pdf.page.margins.left, y, {
        width: pageWidth,
        align: "center",
      });
    y = pdf.y + 14;

    if (includeSummary && doc.summary?.length) {
      pdf
        .fillColor(theme.ink)
        .font("Report")
        .fontSize(10)
        .text("Summary", pdf.page.margins.left, y);
      y = pdf.y + 6;

      const colW = pageWidth / 2 - 10;
      for (let i = 0; i < doc.summary.length; i += 2) {
        const left = doc.summary[i];
        const right = doc.summary[i + 1];
        const rowY = y;
        const leftBottom = this.drawSummaryItem(
          pdf,
          left,
          pdf.page.margins.left,
          rowY,
          colW,
        );
        let rightBottom = rowY;
        if (right) {
          rightBottom = this.drawSummaryItem(
            pdf,
            right,
            pdf.page.margins.left + colW + 20,
            rowY,
            colW,
          );
        }
        y = Math.max(leftBottom, rightBottom, rowY + 26) + 2;
      }
      y += 8;
    }

    const fractions = proportionalWidths(doc);
    const colWidths = fractions.map((f) => f * pageWidth);
    const fontSize = doc.columns.length >= 8 ? 8 : 9;
    const rowPad = 3;

    const drawHeader = () => {
      let x = pdf.page.margins.left;
      const headerH = 18;
      pdf.rect(x, y, pageWidth, headerH).fill(theme.headerBg);
      pdf.fillColor(theme.headerFg).font("Report").fontSize(fontSize);
      doc.columns.forEach((col, i) => {
        pdf.text(col.header, x + rowPad, y + 5, {
          width: colWidths[i] - rowPad * 2,
          height: headerH - 6,
          ellipsis: true,
        });
        x += colWidths[i];
      });
      y += headerH;
    };

    drawHeader();

    if (doc.rows.length === 0) {
      pdf
        .fillColor(theme.muted)
        .font("Report")
        .fontSize(8)
        .text("No records", pdf.page.margins.left, y + 8, {
          width: pageWidth,
          align: "center",
        });
      y += 28;
    } else {
      const lineHeight = pdf
        .font("Report")
        .fontSize(fontSize)
        .currentLineHeight(true);
      const splitLines = (text: string, width: number) =>
        text.split("\n").flatMap((paragraph) => {
          const lines: string[] = [];
          let line = "";
          for (const word of paragraph.split(/\s+/)) {
            if (line && pdf.widthOfString(`${line} ${word}`) > width) {
              lines.push(line);
              line = "";
            }
            if (pdf.widthOfString(word) > width) {
              for (const character of word) {
                if (line && pdf.widthOfString(line + character) > width) {
                  lines.push(line);
                  line = "";
                }
                line += character;
              }
            } else line += (line ? " " : "") + word;
          }
          lines.push(line);
          return lines;
        });
      doc.rows.forEach((row, rowIndex) => {
        const values = doc.columns.map((column, index) =>
          splitLines(
            cellText(row[column.key]),
            Math.max(colWidths[index] - rowPad * 2, 12),
          ),
        );
        const count = Math.max(...values.map((lines) => lines.length), 1);
        let offset = 0;
        while (offset < count) {
          let available = Math.floor(
            (pdf.page.height - pdf.page.margins.bottom - 24 - y - rowPad * 2) /
              lineHeight,
          );
          if (available < 1) {
            this.drawFooter(pdf, doc);
            pdf.addPage();
            y = pdf.page.margins.top;
            drawHeader();
            available = Math.floor(
              (pdf.page.height -
                pdf.page.margins.bottom -
                24 -
                y -
                rowPad * 2) /
                lineHeight,
            );
          }
          const lines = Math.min(count - offset, available);
          const rowH = Math.max(16, lines * lineHeight + rowPad * 2);
          if (rowIndex % 2 === 1)
            pdf
              .rect(pdf.page.margins.left, y, pageWidth, rowH)
              .fill(theme.stripe);
          pdf
            .strokeColor(theme.line)
            .lineWidth(0.4)
            .moveTo(pdf.page.margins.left, y + rowH)
            .lineTo(pdf.page.margins.left + pageWidth, y + rowH)
            .stroke();
          let x = pdf.page.margins.left;
          pdf.fillColor(theme.ink).font("Report").fontSize(fontSize);
          values.forEach((text, index) => {
            text.slice(offset, offset + lines).forEach((line, lineIndex) => {
              pdf.text(line, x + rowPad, y + rowPad + lineIndex * lineHeight, {
                width: Math.max(colWidths[index] - rowPad * 2, 12),
                lineBreak: false,
                align: /[\u0600-\u06ff]/.test(line) ? "right" : "left",
              });
            });
            x += colWidths[index];
          });
          y += rowH;
          offset += lines;
        }
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
    const theme = reportTheme();
    pdf
      .fillColor(theme.muted)
      .font("Report")
      .fontSize(7)
      .text(item.label.toUpperCase(), x, y, { width });
    pdf
      .fillColor(theme.ink)
      .font("Report")
      .fontSize(9)
      .text(item.value || "-", x, y + 10, { width });
    return pdf.y;
  }

  private drawFooter(pdf: PDFKit.PDFDocument, doc: ReportDocument) {
    const theme = reportTheme(doc.letterhead.brandColor);
    const bottom = pdf.page.height - 32;
    const previousY = pdf.y;
    const width =
      pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
    pdf
      .strokeColor(theme.rule)
      .lineWidth(0.7)
      .moveTo(pdf.page.margins.left, bottom - 8)
      .lineTo(pdf.page.margins.left + width, bottom - 8)
      .stroke();

    let footer = (
      doc.letterhead.footer?.trim() ||
      `${doc.letterhead.clinicName} · Confidential`
    ).replace(/\s+/g, " ");
    pdf.font("Report").fontSize(7);
    if (pdf.widthOfString(footer) > width) {
      while (footer && pdf.widthOfString(footer + "...") > width)
        footer = footer.slice(0, -1);
      footer += "...";
    }

    pdf
      .fillColor(theme.muted)
      .font("Report")
      .fontSize(7)
      .text(footer, pdf.page.margins.left, bottom - 2, {
        width,
        align: "center",
        lineBreak: false,
        height: 12,
        ellipsis: true,
      });
    pdf.y = previousY;
  }
}
