import type { Translations } from '@/i18n';
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns';
import type { ReportFormat } from '@/services/reports.service';

export type ReportFormatOption = {
  key: ReportFormat;
  label: string;
  ext: string;
  desc: string;
};

export const getReportFormats = (t: Translations): readonly ReportFormatOption[] => [
  { key: 'pdf', label: t.exports.pdf, ext: '.pdf', desc: t.constants.reportFormats.pdfDesc },
  { key: 'docx', label: t.exports.docx, ext: '.docx', desc: t.constants.reportFormats.docxDesc },
  { key: 'xlsx', label: t.exports.xlsx, ext: '.xlsx', desc: t.constants.reportFormats.xlsxDesc },
  { key: 'csv', label: t.exports.csv, ext: '.csv', desc: t.constants.reportFormats.csvDesc },
] as const;

export type DateRange = { from: string; to: string };

export function currentMonthRange(now = new Date()): DateRange {
  return {
    from: format(startOfMonth(now), 'yyyy-MM-dd'),
    to: format(endOfMonth(now), 'yyyy-MM-dd'),
  };
}

export type DateRangePreset = {
  label: string;
  range: (now?: Date) => DateRange;
};

export const getDateRangePresets = (t: Translations): readonly DateRangePreset[] => [
  {
    label: t.constants.dateRanges['This month'],
    range: (now = new Date()) => ({
      from: format(startOfMonth(now), 'yyyy-MM-dd'),
      to: format(endOfMonth(now), 'yyyy-MM-dd'),
    }),
  },
  {
    label: t.constants.dateRanges['Last month'],
    range: (now = new Date()) => {
      const d = subMonths(now, 1);
      return {
        from: format(startOfMonth(d), 'yyyy-MM-dd'),
        to: format(endOfMonth(d), 'yyyy-MM-dd'),
      };
    },
  },
  {
    label: t.constants.dateRanges['This year'],
    range: (now = new Date()) => ({
      from: format(startOfYear(now), 'yyyy-MM-dd'),
      to: format(endOfYear(now), 'yyyy-MM-dd'),
    }),
  },
] as const;
