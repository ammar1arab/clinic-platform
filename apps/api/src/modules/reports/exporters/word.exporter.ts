import { Injectable } from "@nestjs/common";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  PageNumber,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TableLayoutType,
  TextRun,
  WidthType,
} from "docx";
import { reportLogo } from "../utils/report-logo";
import { ReportDocument } from "../types/report-document";
import { ExportedReport, ReportExporter } from "./report-exporter";
import {
  reportTheme,
  cellText,
  chunkColumns,
  letterheadLines,
  metaLine,
  useLandscape,
  proportionalWidths,
} from "../utils/report-theme";

@Injectable()
export class WordExporter implements ReportExporter {
  readonly format = "docx" as const;

  async export(source: ReportDocument): Promise<ExportedReport> {
    const logo = await reportLogo(source.letterhead.logoUrl);
    const theme = reportTheme(source.letterhead.brandColor);
    const landscape = useLandscape(source.columns.length);
    const parts = chunkColumns(source, landscape ? 8 : 6);

    const children: (Paragraph | Table)[] = [];
    parts.forEach((doc, index) => {
      if (index > 0) {
        children.push(
          new Paragraph({
            children: [],
            spacing: { before: 280, after: 160 },
            border: {
              top: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: theme.rule.replace("#", ""),
                space: 8,
              },
            },
          }),
        );
      }
      children.push(...this.buildPart(doc, index === 0, logo));
    });

    const document = new Document({
      creator: "Cureva Clinic",
      title: source.title,
      description: metaLine(source),
      styles: {
        default: { document: { run: { font: "DejaVu Sans", size: 18 } } },
      },
      sections: [
        {
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `${source.letterhead.footer?.trim() || source.letterhead.clinicName + " · Confidential"}   ·   `,
                      color: theme.muted.replace("#", ""),
                      size: 14,
                    }),
                    new TextRun({ children: [PageNumber.CURRENT], size: 14 }),
                  ],
                }),
              ],
            }),
          },
          properties: {
            page: {
              size: {
                orientation: landscape
                  ? PageOrientation.LANDSCAPE
                  : PageOrientation.PORTRAIT,
              },
              margin: {
                top: 720,
                bottom: 720,
                left: 720,
                right: 720,
              },
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(document);
    return {
      buffer: Buffer.from(buffer),
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      filename: `${source.filenameBase}.docx`,
    };
  }

  private buildPart(
    doc: ReportDocument,
    includeSummary: boolean,
    logo?: Buffer,
  ) {
    const theme = reportTheme(doc.letterhead.brandColor);
    const children: (Paragraph | Table)[] = [];
    const head = letterheadLines(doc);
    if (logo)
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: "png",
              data: logo,
              transformation: { width: 100, height: 50 },
            }),
          ],
        }),
      );

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: head[0] ?? doc.letterhead.clinicName,
            bold: true,
            color: theme.ink.replace("#", ""),
            size: 28,
          }),
        ],
      }),
    );

    if (head.length > 1) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: head.slice(1).join("  ·  "),
              color: theme.muted.replace("#", ""),
              size: 16,
            }),
          ],
        }),
      );
    }

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          bottom: {
            color: theme.rule.replace("#", ""),
            space: 4,
            style: BorderStyle.SINGLE,
            size: 8,
          },
        },
        spacing: { after: 160 },
        children: [],
      }),
    );

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: doc.title,
            bold: true,
            color: theme.ink.replace("#", ""),
            size: 22,
          }),
        ],
      }),
    );

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: metaLine(doc),
            color: theme.muted.replace("#", ""),
            size: 16,
          }),
        ],
      }),
    );

    if (includeSummary && doc.summary?.length) {
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: "Summary",
              bold: true,
              size: 18,
              color: theme.ink.replace("#", ""),
            }),
          ],
        }),
      );
      for (const item of doc.summary) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `${item.label}: `,
                bold: true,
                size: 16,
                color: theme.muted.replace("#", ""),
              }),
              new TextRun({
                text: item.value || "—",
                size: 16,
                color: theme.ink.replace("#", ""),
              }),
            ],
          }),
        );
      }
      children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    }

    children.push(this.buildTable(doc));

    return children;
  }

  private buildTable(doc: ReportDocument): Table {
    const theme = reportTheme(doc.letterhead.brandColor);
    const border = {
      style: BorderStyle.SINGLE,
      size: 4,
      color: theme.line.replace("#", ""),
    };
    const borders = {
      top: border,
      bottom: border,
      left: border,
      right: border,
    };
    const colCount = Math.max(doc.columns.length, 1);
    const tableWidth = useLandscape(doc.columns.length) ? 15398 : 10466;
    const colWidths = proportionalWidths(doc).map((fraction) =>
      Math.floor(fraction * tableWidth),
    );
    const fontSize = colCount >= 8 ? 16 : 18;

    const headerRow = new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: doc.columns.map(
        (col, colIndex) =>
          new TableCell({
            borders,
            width: { size: colWidths[colIndex], type: WidthType.DXA },
            shading: { fill: theme.headerBg.replace("#", "") },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: col.header,
                    bold: true,
                    color: theme.headerFg.replace("#", ""),
                    size: fontSize,
                  }),
                ],
              }),
            ],
          }),
      ),
    });

    const dataRows =
      doc.rows.length === 0
        ? [
            new TableRow({
              children: [
                new TableCell({
                  borders,
                  columnSpan: colCount,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: "No records",
                          italics: true,
                          color: theme.muted.replace("#", ""),
                          size: 16,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ]
        : doc.rows.map(
            (row, index) =>
              new TableRow({
                cantSplit: true,
                children: doc.columns.map(
                  (col, colIndex) =>
                    new TableCell({
                      borders,
                      width: { size: colWidths[colIndex], type: WidthType.DXA },
                      shading:
                        index % 2 === 1
                          ? { fill: theme.stripe.replace("#", "") }
                          : undefined,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: cellText(row[col.key]),
                              size: fontSize,
                              color: theme.ink.replace("#", ""),
                            }),
                          ],
                        }),
                      ],
                    }),
                ),
              }),
          );

    return new Table({
      width: { size: tableWidth, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      columnWidths: colWidths,
      margins: { top: 60, bottom: 60, left: 70, right: 70 },
      rows: [headerRow, ...dataRows],
    });
  }
}
