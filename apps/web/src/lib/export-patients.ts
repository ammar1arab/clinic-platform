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
  ink: '#0F172A',
  muted: '#64748B',
  headerBg: '#0F766E',
  headerFg: '#FFFFFF',
  stripe: '#F8FAFC',
  accent: '#0D9488',
  line: '#CBD5E1',
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

/** Export the currently filtered/sorted patient list as CSV (Excel-friendly BOM). */
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

/** SpreadsheetML — opens in Excel / LibreOffice (.xls). */
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

/** Opens a print dialog so the user can Save as PDF. */
export function exportPatientsPdf(patients: Patient[], title = 'Patients directory') {
  const rows = patients
    .map((p, index) => {
      const bg = index % 2 === 1 ? `background:${THEME.stripe};` : '';
      const cells = rowValues(p)
        .map((v) => `<td style="${bg}">${xmlEscape(String(v))}</td>`)
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
    body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 11px; color: ${THEME.ink}; margin: 28px; }
    .accent { height: 3px; background: ${THEME.accent}; margin: 10px 0 16px; border: 0; }
    h1 { font-size: 18px; margin: 0; }
    p { margin: 4px 0 0; color: ${THEME.muted}; font-size: 10px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid ${THEME.line}; padding: 5px 7px; text-align: left; }
    th { background: ${THEME.headerBg}; color: ${THEME.headerFg}; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.02em; }
    footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid ${THEME.line}; color: ${THEME.muted}; font-size: 9px; text-align: center; }
  </style>
</head>
<body>
  <h1>${xmlEscape(title)}</h1>
  <p>${patients.length} patient${patients.length === 1 ? '' : 's'} · Generated ${xmlEscape(new Date().toLocaleString())}</p>
  <hr class="accent" />
  <table>
    <thead><tr>${headers}</tr></thead>
    <tbody>${rows || '<tr><td colspan="13">No records</td></tr>'}</tbody>
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

/** Word-compatible HTML document (.doc) — opens in Microsoft Word. */
export function exportPatientsWord(patients: Patient[], filename = 'patients.doc') {
  const headerCells = HEADERS.map(
    (h) =>
      `<th style="background:${THEME.headerBg};color:${THEME.headerFg};padding:6px 8px;border:1px solid ${THEME.line};text-align:left;">${xmlEscape(h)}</th>`,
  ).join('');

  const bodyRows =
    patients.length === 0
      ? `<tr><td colspan="13" style="padding:8px;border:1px solid ${THEME.line};color:${THEME.muted};font-style:italic;">No records</td></tr>`
      : patients
          .map((p, index) => {
            const bg = index % 2 === 1 ? THEME.stripe : '#FFFFFF';
            const cells = rowValues(p)
              .map(
                (v) =>
                  `<td style="background:${bg};padding:5px 8px;border:1px solid ${THEME.line};">${xmlEscape(String(v))}</td>`,
              )
              .join('');
            return `<tr>${cells}</tr>`;
          })
          .join('');

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:w="urn:schemas-microsoft-com:office:word"
 xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Patients directory</title></head>
<body style="font-family:Calibri,Segoe UI,sans-serif;color:${THEME.ink};">
  <h1 style="margin:0 0 4px;font-size:20px;">Patients directory</h1>
  <p style="margin:0 0 12px;color:${THEME.muted};font-size:11px;">
    ${patients.length} patients · Generated ${xmlEscape(new Date().toLocaleString())}
  </p>
  <div style="border-top:3px solid ${THEME.accent};margin-bottom:16px;"></div>
  <table style="border-collapse:collapse;width:100%;font-size:11px;">
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <p style="margin-top:20px;color:${THEME.muted};font-size:10px;text-align:center;">
    Confidential · Clinic Platform
  </p>
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
