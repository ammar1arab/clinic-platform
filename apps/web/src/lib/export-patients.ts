import type { Patient } from '@/services/patients.service';

export type PatientExportFormat = 'csv' | 'xlsx' | 'pdf' | 'docx';

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

const THEME = {
  ink: '#1E293B',
  muted: '#64748B',
  headerBg: '#334155',
  headerFg: '#FFFFFF',
  stripe: '#F8FAFC',
  rule: '#CBD5E1',
  line: '#E2E8F0',
} as const;

const HEADERS = [
  'First Name',
  'Last Name',
  'Phone',
  'Email',
  'National ID',
  'Gender',
  'Blood Type',
  'DOB',
  'Primary Doctor',
  'Total Sessions',
  'First Visit',
  'Last Visit',
  'Status',
] as const;

function rowValues(p: Patient): (string | number)[] {
  return [
    p.firstNameEn ?? '',
    p.lastNameEn ?? '',
    p.phone ?? '',
    p.email ?? '',
    p.nationalId ?? '',
    p.gender ?? '',
    p.bloodType ?? '',
    p.dob ? p.dob.slice(0, 10) : '',
    p.primaryDoctorName ?? '',
    p.totalSessions ?? 0,
    p.firstVisit ? p.firstVisit.slice(0, 10) : '',
    p.lastVisit ? p.lastVisit.slice(0, 10) : '',
    p.isActive ? 'Active' : 'Inactive',
  ];
}


export function exportPatientsCsv(patients: Patient[], filename = 'patients.csv') {
  const preface = [
    '# Patients directory',
    `# Generated ${new Date().toLocaleString()}`,
    `# Count: ${patients.length}`,
    '#',
  ];
  const rows = patients.map((p) => rowValues(p).map(csvEscape).join(','));
  const bom = '\uFEFF';
  const csv = [...preface, HEADERS.join(','), ...rows].join('\r\n');
  triggerDownload(bom + csv, filename, 'text/csv;charset=utf-8');
}


export function exportPatientsExcel(patients: Patient[], filename = 'patients.xls') {
  const headerCells = HEADERS.map(
    (h) =>
      `<Cell ss:StyleID="Header"><Data ss:Type="String">${xmlEscape(h)}</Data></Cell>`,
  ).join('');

  const dataRows =
    patients.length === 0
      ? `<Row><Cell ss:StyleID="Muted"><Data ss:Type="String">No records</Data></Cell></Row>`
      : patients
          .map((p, index) => {
            const style = index % 2 === 1 ? ' ss:StyleID="Stripe"' : '';
            const cells = rowValues(p)
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
    <Style ss:ID="Title">
      <Font ss:Bold="1" ss:Size="14" ss:Color="${THEME.ink}"/>
    </Style>
    <Style ss:ID="Muted">
      <Font ss:Size="9" ss:Color="${THEME.muted}"/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="${THEME.headerFg}"/>
      <Interior ss:Color="${THEME.headerBg}" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Stripe">
      <Interior ss:Color="${THEME.stripe}" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Patients">
    <Table>
      <Row><Cell ss:StyleID="Title"><Data ss:Type="String">Patients directory</Data></Cell></Row>
      <Row><Cell ss:StyleID="Muted"><Data ss:Type="String">Generated ${xmlEscape(new Date().toLocaleString())} · ${patients.length} patients</Data></Cell></Row>
      <Row></Row>
      <Row>${headerCells}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;

  triggerDownload(xml, filename, 'application/vnd.ms-excel');
}


export function exportPatientsPdf(patients: Patient[], title = 'Patients directory') {
  const rows = patients
    .map((p, index) => {
      const bg = index % 2 === 1 ? `background:${THEME.stripe};` : '';
      const cells = rowValues(p)
        .map((v) => `<td style="${bg}">${xmlEscape(String(v || '—'))}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const headers = HEADERS.map((h) => `<th>${xmlEscape(h)}</th>`).join('');
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${xmlEscape(title)}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Calibri, system-ui, sans-serif;
      font-size: 8.5px;
      color: ${THEME.ink};
      margin: 0;
    }
    .head { text-align: center; margin-bottom: 10px; }
    h1 { font-size: 15px; margin: 0 0 2px; font-weight: 700; }
    .meta { margin: 0; color: ${THEME.muted}; font-size: 8px; }
    .rule { height: 1px; background: ${THEME.rule}; border: 0; margin: 8px 0 10px; }
    table { border-collapse: collapse; width: 100%; table-layout: fixed; }
    th, td {
      border: 1px solid ${THEME.line};
      padding: 3px 4px;
      text-align: left;
      vertical-align: top;
      word-wrap: break-word;
      overflow-wrap: anywhere;
    }
    th {
      background: ${THEME.headerBg};
      color: ${THEME.headerFg};
      font-weight: 600;
      font-size: 7.5px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    footer {
      margin-top: 12px;
      padding-top: 6px;
      border-top: 1px solid ${THEME.rule};
      color: ${THEME.muted};
      font-size: 7.5px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="head">
    <h1>${xmlEscape(title)}</h1>
    <p class="meta">${patients.length} patient${patients.length === 1 ? '' : 's'} · Generated ${xmlEscape(new Date().toLocaleString())}</p>
  </div>
  <hr class="rule" />
  <table>
    <thead><tr>${headers}</tr></thead>
    <tbody>${rows || `<tr><td colspan="${HEADERS.length}" style="text-align:center;color:${THEME.muted};">No records</td></tr>`}</tbody>
  </table>
  <footer>Confidential · Clinic Platform</footer>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}


export function exportPatientsWord(patients: Patient[], filename = 'patients.doc') {
  const headerCells = HEADERS.map(
    (h) =>
      `<th style="background:${THEME.headerBg};color:${THEME.headerFg};padding:4px 5px;border:1px solid ${THEME.line};text-align:left;font-size:8pt;">${xmlEscape(h)}</th>`,
  ).join('');

  const bodyRows =
    patients.length === 0
      ? `<tr><td colspan="${HEADERS.length}" style="padding:8px;border:1px solid ${THEME.line};color:${THEME.muted};font-style:italic;text-align:center;">No records</td></tr>`
      : patients
          .map((p, index) => {
            const bg = index % 2 === 1 ? THEME.stripe : '#FFFFFF';
            const cells = rowValues(p)
              .map(
                (v) =>
                  `<td style="background:${bg};padding:3px 5px;border:1px solid ${THEME.line};font-size:8pt;word-wrap:break-word;">${xmlEscape(String(v || '—'))}</td>`,
              )
              .join('');
            return `<tr>${cells}</tr>`;
          })
          .join('');

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:w="urn:schemas-microsoft-com:office:word"
 xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Patients directory</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page Section1 {
    size: 841.9pt 595.3pt;
    mso-page-orientation: landscape;
    margin: 36pt 36pt 36pt 36pt;
  }
  div.Section1 { page: Section1; }
  body { font-family: Calibri, Segoe UI, sans-serif; color: ${THEME.ink}; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; }
</style>
</head>
<body>
<div class="Section1">
  <div style="text-align:center;margin-bottom:10px;">
    <h1 style="margin:0 0 4px;font-size:16pt;">Patients directory</h1>
    <p style="margin:0;color:${THEME.muted};font-size:9pt;">
      ${patients.length} patients · Generated ${xmlEscape(new Date().toLocaleString())}
    </p>
  </div>
  <div style="border-top:1px solid ${THEME.rule};margin:8px 0 12px;"></div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <p style="margin-top:16px;color:${THEME.muted};font-size:8pt;text-align:center;">
    Confidential · Clinic Platform
  </p>
</div>
</body></html>`;

  triggerDownload('\ufeff' + html, filename, 'application/msword');
}

export function exportPatients(
  patients: Patient[],
  format: PatientExportFormat,
  baseName = `patients-${new Date().toISOString().slice(0, 10)}`,
) {
  if (format === 'csv') exportPatientsCsv(patients, `${baseName}.csv`);
  else if (format === 'xlsx') exportPatientsExcel(patients, `${baseName}.xls`);
  else if (format === 'docx') exportPatientsWord(patients, `${baseName}.doc`);
  else exportPatientsPdf(patients, 'Patients directory');
}
