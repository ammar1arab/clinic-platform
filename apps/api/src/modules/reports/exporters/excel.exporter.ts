import { Injectable } from "@nestjs/common";
import ExcelJS from "exceljs";
import { ReportDocument } from "../types/report-document";
import { ExportedReport, ReportExporter } from "./report-exporter";
import {
  letterheadLines,
  metaLine,
  proportionalWidths,
  reportTheme,
  useLandscape,
} from "../utils/report-theme";
import { reportLogo } from "../utils/report-logo";

@Injectable()
export class ExcelExporter implements ReportExporter {
  readonly format = "xlsx" as const;

  async export(doc: ReportDocument): Promise<ExportedReport> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = doc.letterhead.clinicName;
    workbook.created = doc.generatedAt;
    const sheet = workbook.addWorksheet("Report", {
      pageSetup: {
        paperSize: 9,
        orientation: useLandscape(doc.columns.length)
          ? "landscape"
          : "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });
    const theme = reportTheme(doc.letterhead.brandColor);
    const color = (hex: string) => ({ argb: "FF" + hex.slice(1) });
    const widths = proportionalWidths(doc);
    const count = Math.max(doc.columns.length, 2);
    widths.forEach((width, index) => {
      sheet.getColumn(index + 1).width = Math.max(
        12,
        Math.min(42, width * 180),
      );
    });
    const logo = await reportLogo(doc.letterhead.logoUrl);
    if (logo) {
      const image = workbook.addImage({
        base64: "data:image/png;base64," + logo.toString("base64"),
        extension: "png",
      });
      sheet.addImage(image, {
        tl: { col: 0, row: 0 },
        ext: { width: 100, height: 50 },
      });
      sheet.addRow([]).height = 42;
    }
    const heading = (text: string, size: number, bold = false) => {
      const row = sheet.addRow([text]);
      sheet.mergeCells(row.number, 1, row.number, count);
      row.font = { name: "Calibri", size, bold, color: color(theme.ink) };
      row.height = size * 1.7;
    };
    letterheadLines(doc).forEach((line, index) =>
      heading(line, index ? 10 : 16, index === 0),
    );
    heading(doc.title, 13, true);
    heading(metaLine(doc), 9);
    sheet.addRow([]);
    for (const item of doc.summary ?? []) {
      const row = sheet.addRow([item.label, item.value]);
      row.font = { name: "Calibri", size: 10 };
      row.getCell(1).font = { ...row.font, bold: true };
      row.alignment = { vertical: "top", wrapText: true };
    }
    if (doc.summary?.length) sheet.addRow([]);
    const header = sheet.addRow(doc.columns.map((column) => column.header));
    header.height = 28;
    header.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: color(theme.headerBg),
      };
      cell.font = {
        name: "Calibri",
        bold: true,
        color: color(theme.headerFg),
        size: 10,
      };
      cell.alignment = { vertical: "middle", wrapText: true };
    });
    doc.rows.forEach((record, index) => {
      const row = sheet.addRow(
        doc.columns.map((column) => record[column.key] ?? ""),
      );
      row.font = { name: "Calibri", size: 10, color: color(theme.ink) };
      row.alignment = { vertical: "top", wrapText: true };
      row.eachCell({ includeEmpty: true }, (cell) => {
        if (index % 2)
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: color(theme.stripe),
          };
        cell.border = { bottom: { style: "hair", color: color(theme.line) } };
      });
    });
    sheet.autoFilter = {
      from: { row: header.number, column: 1 },
      to: {
        row: Math.max(header.number, sheet.rowCount),
        column: doc.columns.length,
      },
    };
    sheet.views = [{ state: "frozen", ySplit: header.number }];
    sheet.pageSetup.printTitlesRow = `1:${header.number}`;
    sheet.headerFooter.oddFooter = `&L${(doc.letterhead.footer?.trim() || doc.letterhead.clinicName).replaceAll("&", "&&")}&R&P / &N`;
    sheet.pageSetup.printArea = `A1:${sheet.getColumn(count).letter}${sheet.rowCount}`;
    return {
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `${doc.filenameBase}.xlsx`,
    };
  }
}
