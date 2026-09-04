import { getTranslations, getLanguage, type Translations } from '@/i18n';
export type TableExportFormat = 'csv' | 'xlsx' | 'pdf' | 'docx';

export type TableExportColumn<T> = {
  header: string;
  value: (row: T) => string | number;
};

const THEME = {
  ink: '#1E293B',
  muted: '#64748B',
  headerBg: '#334155',
  headerFg: '#FFFFFF',
  stripe: '#F8FAFC',
  rule: '#CBD5E1',
  line: '#E2E8F0',
} as const;

function csvEscape(value: string | number | null | undefined) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function triggerDownload(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function rowValues<T>(row: T, columns: TableExportColumn<T>[]) {
  return columns.map((c) => c.value(row));
}

export function exportTable<T>(opts: {
  rows: T[];
  columns: TableExportColumn<T>[];
  format: TableExportFormat;
  title: string;
  sheetName: string;
  filename: string;
  t?: Translations;
  lang?: string;
}) {
  const {
    rows,
    columns,
    format,
    title,
    sheetName,
    filename,
    lang = getLanguage(),
    t = getTranslations(lang),
  } = opts;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const headers = columns.map((c) => c.header);

  if (format === 'csv') {
    const preface = [
      `# ${title}`,
      `# ${t.common.generated} ${new Date().toLocaleString(lang)}`,
      `# ${t.common.count}: ${rows.length}`,
      '#',
    ];
    const body = rows.map((row) =>
      rowValues(row, columns).map(csvEscape).join(','),
    );
    triggerDownload(
      `\uFEFF${[...preface, headers.join(','), ...body].join('\r\n')}`,
      `${filename}.csv`,
      'text/csv;charset=utf-8',
    );
    return;
  }

  if (format === 'xlsx') {
    const headerCells = headers
      .map(
        (h) =>
          `<Cell ss:StyleID="Header"><Data ss:Type="String">${xmlEscape(h)}</Data></Cell>`,
      )
      .join('');
    const dataRows =
      rows.length === 0
        ? `<Row><Cell ss:StyleID="Muted"><Data ss:Type="String">${t.common.noRecords}</Data></Cell></Row>`
        : rows
            .map((row, index) => {
              const style = index % 2 === 1 ? ' ss:StyleID="Stripe"' : '';
              const cells = rowValues(row, columns)
                .map((raw) => {
                  if (typeof raw === 'number' && Number.isFinite(raw)) {
                    return `<Cell${style}><Data ss:Type="Number">${raw}</Data></Cell>`;
                  }
                  return `<Cell${style}><Data ss:Type="String">${xmlEscape(String(raw))}</Data></Cell>`;
                })
                .join('');
              return `<Row>${cells}</Row>`;
            })
            .join('');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="14" ss:Color="${THEME.ink}"/></Style>
    <Style ss:ID="Muted"><Font ss:Size="9" ss:Color="${THEME.muted}"/></Style>
    <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="${THEME.headerFg}"/><Interior ss:Color="${THEME.headerBg}" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Stripe"><Interior ss:Color="${THEME.stripe}" ss:Pattern="Solid"/></Style>
  </Styles>
  <Worksheet ss:Name="${xmlEscape(sheetName)}" ss:RightToLeft="${dir === 'rtl' ? 1 : 0}">
    <Table>
      <Row><Cell ss:StyleID="Title"><Data ss:Type="String">${xmlEscape(title)}</Data></Cell></Row>
      <Row><Cell ss:StyleID="Muted"><Data ss:Type="String">${t.common.generated} ${xmlEscape(new Date().toLocaleString(lang))} · ${rows.length} ${t.common.records}</Data></Cell></Row>
      <Row></Row>
      <Row>${headerCells}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;
    triggerDownload(xml, `${filename}.xls`, 'application/vnd.ms-excel');
    return;
  }

  if (format === 'docx') {
    const headerCells = headers
      .map(
        (h) =>
          `<th style="background:${THEME.headerBg};color:${THEME.headerFg};padding:4px 5px;border:1px solid ${THEME.line};text-align:start;font-size:8pt;">${xmlEscape(h)}</th>`,
      )
      .join('');
    const bodyRows =
      rows.length === 0
        ? `<tr><td colspan="${headers.length}" style="padding:8px;border:1px solid ${THEME.line};color:${THEME.muted};text-align:center;">${t.common.noRecords}</td></tr>`
        : rows
            .map((row, index) => {
              const bg = index % 2 === 1 ? THEME.stripe : '#FFFFFF';
              const cells = rowValues(row, columns)
                .map(
                  (v) =>
                    `<td style="background:${bg};padding:3px 5px;border:1px solid ${THEME.line};font-size:8pt;word-wrap:break-word;">${xmlEscape(String(v || '-'))}</td>`,
                )
                .join('');
              return `<tr>${cells}</tr>`;
            })
            .join('');
    const html = `<html lang="${lang}" dir="${dir}" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${xmlEscape(title)}</title>
<style>
  @page Section1 { size: 841.9pt 595.3pt; mso-page-orientation: landscape; margin: 36pt; }
  div.Section1 { page: Section1; }
  body { font-family: Calibri, Segoe UI, sans-serif; color: ${THEME.ink}; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; }
</style></head>
<body><div class="Section1">
  <div style="text-align:center;margin-bottom:10px;">
    <h1 style="margin:0 0 4px;font-size:16pt;">${xmlEscape(title)}</h1>
    <p style="margin:0;color:${THEME.muted};font-size:9pt;">${rows.length} ${t.common.records} · ${t.common.generated} ${xmlEscape(new Date().toLocaleString(lang))}</p>
  </div>
  <table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
</div></body></html>`;
    triggerDownload('\ufeff' + html, `${filename}.doc`, 'application/msword');
    return;
  }

  const tableRows = rows
    .map((row, index) => {
      const bg = index % 2 === 1 ? `background:${THEME.stripe};` : '';
      const cells = rowValues(row, columns)
        .map((v) => `<td style="${bg}">${xmlEscape(String(v || '-'))}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  const th = headers.map((h) => `<th>${xmlEscape(h)}</th>`).join('');
  const html = `<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8" /><title>${xmlEscape(title)}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: 'Segoe UI', Calibri, system-ui, sans-serif; font-size: 8.5px; color: ${THEME.ink}; margin: 0; }
  h1 { font-size: 15px; margin: 0 0 2px; }
  .meta { margin: 0; color: ${THEME.muted}; font-size: 8px; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; }
  th, td { border: 1px solid ${THEME.line}; padding: 3px 4px; text-align: start; vertical-align: top; word-wrap: break-word; }
  th { background: ${THEME.headerBg}; color: ${THEME.headerFg}; font-size: 7.5px; text-transform: uppercase; }
</style></head>
<body>
  <div style="text-align:center;margin-bottom:10px;">
    <h1>${xmlEscape(title)}</h1>
    <p class="meta">${rows.length} ${t.common.records} · ${t.common.generated} ${xmlEscape(new Date().toLocaleString(lang))}</p>
  </div>
  <table><thead><tr>${th}</tr></thead>
  <tbody>${tableRows || `<tr><td colspan="${headers.length}" style="text-align:center;color:${THEME.muted};">${t.common.noRecords}</td></tr>`}</tbody></table>
  <script>window.onload = function () { window.print(); };</script>
</body></html>`;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
