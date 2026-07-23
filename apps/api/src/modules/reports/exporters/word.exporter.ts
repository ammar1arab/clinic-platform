import { Injectable } from "@nestjs/common";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { ReportDocument } from "../types/report-document";
import { ExportedReport, ReportExporter } from "./report-exporter";
import {
  REPORT_THEME,
  cellText,
  letterheadLines,
  metaLine,
} from "../utils/report-theme";

@Injectable()
export class WordExporter implements ReportExporter {
  readonly format = "docx" as const;

  async export(doc: ReportDocument): Promise<ExportedReport> {
    const children: (Paragraph | Table)[] = [];

    const head = letterheadLines(doc);
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: head[0] ?? doc.letterhead.clinicName,
            bold: true,
            color: REPORT_THEME.ink.replace("#", ""),
            size: 32,
          }),
        ],
      }),
    );

    if (head.length > 1) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: head.slice(1).join("  ·  "),
              color: REPORT_THEME.muted.replace("#", ""),
              size: 18,
            }),
          ],
        }),
      );
    }

    children.push(
      new Paragraph({
        border: {
          bottom: {
            color: REPORT_THEME.accent.replace("#", ""),
            space: 1,
            style: BorderStyle.SINGLE,
            size: 18,
          },
        },
        spacing: { after: 200 },
        children: [],
      }),
    );

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: doc.title,
            bold: true,
            color: REPORT_THEME.ink.replace("#", ""),
            size: 26,
          }),
        ],
      }),
    );

    children.push(
      new Paragraph({
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: metaLine(doc),
            color: REPORT_THEME.muted.replace("#", ""),
            size: 18,
            italics: true,
          }),
        ],
      }),
    );

    if (doc.summary?.length) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: "Summary",
              bold: true,
              size: 22,
              color: REPORT_THEME.ink.replace("#", ""),
            }),
          ],
        }),
      );

      for (const item of doc.summary) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: `${item.label}: `,
                bold: true,
                size: 18,
                color: REPORT_THEME.muted.replace("#", ""),
              }),
              new TextRun({
                text: item.value || "—",
                size: 20,
                color: REPORT_THEME.ink.replace("#", ""),
              }),
            ],
          }),
        );
      }

      children.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
    }

    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: "Records",
            bold: true,
            size: 22,
            color: REPORT_THEME.ink.replace("#", ""),
          }),
        ],
      }),
    );

    children.push(this.buildTable(doc));

    const footerText =
      doc.letterhead.footer?.trim() ||
      `${doc.letterhead.clinicName} · Confidential clinical report`;

    children.push(
      new Paragraph({
        spacing: { before: 320 },
        border: {
          top: {
            color: REPORT_THEME.line.replace("#", ""),
            space: 8,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: footerText,
            size: 16,
            color: REPORT_THEME.muted.replace("#", ""),
            italics: true,
          }),
        ],
      }),
    );

    const document = new Document({
      creator: "Cureva Clinic Platform",
      title: doc.title,
      description: metaLine(doc),
      sections: [
        {
          properties: {
            page: {
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
      filename: `${doc.filenameBase}.docx`,
    };
  }

  private buildTable(doc: ReportDocument): Table {
    const border = {
      style: BorderStyle.SINGLE,
      size: 4,
      color: REPORT_THEME.line.replace("#", ""),
    };
    const borders = {
      top: border,
      bottom: border,
      left: border,
      right: border,
    };

    const headerRow = new TableRow({
      tableHeader: true,
      children: doc.columns.map(
        (col) =>
          new TableCell({
            borders,
            width: { size: Math.floor(9000 / Math.max(doc.columns.length, 1)), type: WidthType.DXA },
            shading: { fill: REPORT_THEME.headerBg.replace("#", "") },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: col.header,
                    bold: true,
                    color: REPORT_THEME.headerFg.replace("#", ""),
                    size: 16,
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
                  columnSpan: Math.max(doc.columns.length, 1),
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: "No records",
                          italics: true,
                          color: REPORT_THEME.muted.replace("#", ""),
                          size: 18,
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
                children: doc.columns.map(
                  (col) =>
                    new TableCell({
                      borders,
                      width: {
                        size: Math.floor(
                          9000 / Math.max(doc.columns.length, 1),
                        ),
                        type: WidthType.DXA,
                      },
                      shading:
                        index % 2 === 1
                          ? { fill: REPORT_THEME.stripe.replace("#", "") }
                          : undefined,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: cellText(row[col.key]),
                              size: 16,
                              color: REPORT_THEME.ink.replace("#", ""),
                            }),
                          ],
                        }),
                      ],
                    }),
                ),
              }),
          );

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    });
  }
}
