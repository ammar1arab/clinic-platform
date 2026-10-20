import ExcelJS from "exceljs";
import sharp from "sharp";
import { reportLogo } from "../utils/report-logo";
import JSZip from "jszip";
import { PdfExporter } from "./pdf.exporter";
import { WordExporter } from "./word.exporter";
import { ExcelExporter } from "./excel.exporter";
import { CsvExporter } from "./csv.exporter";
import type { ReportDocument } from "../types/report-document";
import { chunkColumns, reportTheme } from "../utils/report-theme";

const source: ReportDocument = {
  type: "patients_directory",
  title: "Patients",
  filenameBase: "patients",
  generatedAt: new Date("2026-10-20T12:00:00Z"),
  letterhead: {
    clinicName: "Demo Clinic",
    brandColor: "#0F766E",
    footer: "Clinic footer",
  },
  columns: [
    { key: "name", header: "Patient" },
    { key: "phone", header: "Phone" },
    { key: "count", header: "Sessions" },
  ],
  rows: [{ name: "Demo patient", phone: "0790000000", count: 0 }],
};

describe("report exports", () => {
  it("embeds clinic logos saved directly in settings", async () => {
    const png = await sharp({
      create: { width: 20, height: 10, channels: 4, background: "#0F766E" },
    })
      .png()
      .toBuffer();
    const logo = await reportLogo(
      "data:image/png;base64," + png.toString("base64"),
    );
    expect(logo).toBeDefined();
    expect((await sharp(logo).metadata()).format).toBe("png");
    expect(await reportLogo("http://127.0.0.1/private")).toBeUndefined();
  });

  it("keeps a PDF footer on its content page", async () => {
    const { buffer } = await new PdfExporter().export(source);
    expect(buffer.toString("latin1").match(/\/Type \/Page\b/g)).toHaveLength(1);
  });

  it("puts Word footers in a repeating footer part", async () => {
    const { buffer } = await new WordExporter().export(source);
    const zip = await JSZip.loadAsync(buffer);
    const footer = Object.keys(zip.files).find((name) =>
      /^word\/footer\d+\.xml$/.test(name),
    );
    expect(footer).toBeDefined();
    expect(await zip.file(footer!)!.async("string")).toContain("Clinic footer");
    expect(await zip.file("word/document.xml")!.async("string")).not.toContain(
      "Clinic footer",
    );
  });

  it("produces a real XLSX with frozen headers and intact numeric and text cells", async () => {
    const exported = await new ExcelExporter().export(source);
    expect(exported.filename).toBe("patients.xlsx");
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(new Uint8Array(exported.buffer).buffer);
    const sheet = book.worksheets[0];
    const row = sheet.getRow(sheet.rowCount);
    expect(row.getCell(2).value).toBe("0790000000");
    expect(row.getCell(3).value).toBe(0);
    expect(sheet.views[0].state).toBe("frozen");
  });

  it("protects spreadsheet formula-like CSV cells", async () => {
    const { buffer } = await new CsvExporter().export({
      ...source,
      rows: [{ name: "=1+1", phone: "0790000000", count: 0 }],
    });
    expect(buffer.toString("utf8")).toContain("'=1+1");
  });

  it("repeats record identity when a table needs continuation columns", () => {
    const doc = {
      ...source,
      columns: Array.from({ length: 13 }, (_, index) => ({
        key: "c" + index,
        header: String(index),
      })),
    };
    const parts = chunkColumns(doc, 8);
    expect(parts[1].columns[0].key).toBe("c0");
    expect(
      new Set(parts.flatMap((part) => part.columns.map((column) => column.key)))
        .size,
    ).toBe(13);
    expect(reportTheme("#0F766E").headerBg).toBe("#0F766E");
    expect(reportTheme("invalid").headerBg).toMatch(/^#[0-9A-F]{6}$/i);
  });
});
