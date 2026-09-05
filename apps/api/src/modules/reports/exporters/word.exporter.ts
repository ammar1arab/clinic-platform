import { Injectable } from "@nestjs/common";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  PageOrientation,
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
  chunkColumns,
  letterheadLines,
  metaLine,
  useLandscape,
} from "../utils/report-theme";

@Injectable()
export class WordExporter implements ReportExporter {
  readonly format = "docx" as const;

  async export(source: ReportDocument): Promise<ExportedReport> {
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
                color: REPORT_THEME.rule.replace("#", ""),
                space: 8,
              },
            },
          }),
        );
      }
      children.push(...this.buildPart(doc, index === 0));
    });

    const document = new Document({
      creator: "Cureva Clinic",
      title: source.title,
      description: metaLine(source),
      sections: [
        {
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

  private buildPart(doc: ReportDocument, includeSummary: boolean) {
    const children: (Paragraph | Table)[] = [];
    const head = letterheadLines(doc);

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: head[0] ?? doc.letterhead.clinicName,
            bold: true,
            color: REPORT_THEME.ink.replace("#", ""),
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
              color: REPORT_THEME.muted.replace("#", ""),
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
            color: REPORT_THEME.rule.replace("#", ""),
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
            color: REPORT_THEME.ink.replace("#", ""),
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
            color: REPORT_THEME.muted.replace("#", ""),
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
              color: REPORT_THEME.ink.replace("#", ""),
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
                color: REPORT_THEME.muted.replace("#", ""),
              }),
              new TextRun({
                text: item.value || "—",
                size: 16,
                color: REPORT_THEME.ink.replace("#", ""),
              }),
            ],
          }),
        );
      }
      children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    }

    children.push(this.buildTable(doc));

    const footerText =
      doc.letterhead.footer?.trim() ||
      `${doc.letterhead.clinicName} · Confidential`;

    children.push(
      new Paragraph({
        spacing: { before: 240 },
        alignment: AlignmentType.CENTER,
        border: {
          top: {
            color: REPORT_THEME.rule.replace("#", ""),
            space: 8,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        children: [
          new TextRun({
            text: footerText,
            size: 14,
            color: REPORT_THEME.muted.replace("#", ""),
          }),
        ],
      }),
    );

    return children;
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
    const colCount = Math.max(doc.columns.length, 1);
    const colWidth = Math.floor(9000 / colCount);
    const fontSize = colCount >= 8 ? 12 : colCount >= 6 ? 14 : 16;

    const headerRow = new TableRow({
      tableHeader: true,
      children: doc.columns.map(
        (col) =>
          new TableCell({
            borders,
            width: { size: colWidth, type: WidthType.DXA },
            shading: { fill: REPORT_THEME.headerBg.replace("#", "") },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: col.header,
                    bold: true,
                    color: REPORT_THEME.headerFg.replace("#", ""),
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
                          color: REPORT_THEME.muted.replace("#", ""),
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
                children: doc.columns.map(
                  (col) =>
                    new TableCell({
                      borders,
                      width: { size: colWidth, type: WidthType.DXA },
                      shading:
                        index % 2 === 1
                          ? { fill: REPORT_THEME.stripe.replace("#", "") }
                          : undefined,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: cellText(row[col.key]),
                              size: fontSize,
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
