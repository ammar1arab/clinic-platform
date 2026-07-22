import type { Patient } from '@/services/patients.service';

export type PatientExportFormat = 'csv' | 'xlsx' | 'pdf';

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
  const rows = patients.map((p) => rowValues(p).map(csvEscape).join(','));
  const bom = '\uFEFF';
  const csv = [HEADERS.join(','), ...rows].join('\r\n');
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
      ? `<Row><Cell><Data ss:Type="String">No records</Data></Cell></Row>`
      : patients
          .map((p) => {
            const cells = rowValues(p)
              .map((raw) => {
                if (typeof raw === 'number' && Number.isFinite(raw)) {
                  return `<Cell><Data ss:Type="Number">${raw}</Data></Cell>`;
                }
                return `<Cell><Data ss:Type="String">${xmlEscape(String(raw))}</Data></Cell>`;
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
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#F5F5F5" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Patients">
    <Table>
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
    .map((p) => {
      const cells = rowValues(p)
        .map((v) => `<td>${xmlEscape(String(v))}</td>`)
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
    body { font-family: system-ui, sans-serif; font-size: 11px; color: #111; margin: 24px; }
    h1 { font-size: 16px; margin: 0 0 4px; }
    p { margin: 0 0 16px; color: #555; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
  </style>
</head>
<body>
  <h1>${xmlEscape(title)}</h1>
  <p>${patients.length} patient${patients.length === 1 ? '' : 's'} · Generated ${new Date().toLocaleString()}</p>
  <table>
    <thead><tr>${headers}</tr></thead>
    <tbody>${rows || '<tr><td colspan="13">No records</td></tr>'}</tbody>
  </table>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

export function exportPatients(
  patients: Patient[],
  format: PatientExportFormat,
  baseName = `patients-${new Date().toISOString().slice(0, 10)}`,
) {
  if (format === 'csv') exportPatientsCsv(patients, `${baseName}.csv`);
  else if (format === 'xlsx') exportPatientsExcel(patients, `${baseName}.xls`);
  else exportPatientsPdf(patients, 'Patients directory');
}
