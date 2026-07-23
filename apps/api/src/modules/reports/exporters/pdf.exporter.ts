import { Injectable } from "@nestjs/common";
import puppeteer from "puppeteer";
import { ReportDocument } from "../types/report-document";
import { ExportedReport, ReportExporter } from "./report-exporter";
import { escapeHtml, formatDisplayDate } from "../utils/report-format";

@Injectable()
export class PdfExporter implements ReportExporter {
  readonly format = "pdf" as const;

  async export(doc: ReportDocument): Promise<ExportedReport> {
    const html = this.buildHtml(doc);
    const buffer = await this.renderPdf(html);
    return {
      buffer,
      contentType: "application/pdf",
      filename: `${doc.filenameBase}.pdf`,
    };
  }

  private buildHtml(doc: ReportDocument): string {
    const { letterhead } = doc;
    const logoHtml = letterhead.logoUrl
      ? `<img src="${escapeHtml(letterhead.logoUrl)}" alt="Clinic logo" class="logo" />`
      : "";

    const summaryHtml =
      doc.summary && doc.summary.length > 0
        ? `<section class="section">
            <h2>Summary</h2>
            <dl class="summary-grid">
              ${doc.summary
                .map(
                  (item) => `
                <div>
                  <dt>${escapeHtml(item.label)}</dt>
                  <dd>${escapeHtml(item.value)}</dd>
                </div>`,
                )
                .join("")}
            </dl>
          </section>`
        : "";

    const head = doc.columns
      .map((c) => `<th>${escapeHtml(c.header)}</th>`)
      .join("");

    const body =
      doc.rows.length === 0
        ? `<tr><td colspan="${doc.columns.length}" class="empty">No records</td></tr>`
        : doc.rows
            .map(
              (row) =>
                `<tr>${doc.columns
                  .map((c) => {
                    const raw = row[c.key];
                    const text =
                      raw === null || raw === undefined ? "—" : String(raw);
                    return `<td>${escapeHtml(text)}</td>`;
                  })
                  .join("")}</tr>`,
            )
            .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(doc.title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      color: #1a1a1a;
      padding: 32px 40px;
      line-height: 1.45;
    }
    .letterhead {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      border-bottom: 2px solid #1a1a1a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .logo { max-height: 64px; max-width: 120px; object-fit: contain; }
    .clinic-meta h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .clinic-meta p { color: #555; font-size: 11px; }
    .meta { color: #666; font-size: 10px; margin-bottom: 20px; }
    h2 { font-size: 15px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
    .section { margin-bottom: 24px; }
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 24px;
    }
    .summary-grid dt {
      font-weight: 600;
      color: #444;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .summary-grid dd { margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #f5f5f5; font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em; }
    td.empty { text-align: center; color: #888; font-style: italic; }
    .footer {
      margin-top: 36px;
      padding-top: 12px;
      border-top: 1px solid #ccc;
      font-size: 10px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <header class="letterhead">
    ${logoHtml}
    <div class="clinic-meta">
      <h1>${escapeHtml(letterhead.clinicName)}</h1>
      ${letterhead.address ? `<p>${escapeHtml(letterhead.address)}</p>` : ""}
      ${letterhead.phone ? `<p>${escapeHtml(letterhead.phone)}</p>` : ""}
    </div>
  </header>

  <p class="meta">${escapeHtml(doc.title)} · Generated ${formatDisplayDate(doc.generatedAt)}</p>

  ${summaryHtml}

  <section class="section">
    <h2>Records</h2>
    <table>
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  </section>

  ${
    letterhead.footer
      ? `<footer class="footer">${escapeHtml(letterhead.footer)}</footer>`
      : ""
  }
</body>
</html>`;
  }

  private async renderPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      const pdf = await page.pdf({ format: "A4", printBackground: true });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
