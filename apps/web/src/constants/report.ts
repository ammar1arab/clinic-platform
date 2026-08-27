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

export const REPORT_FORMATS: readonly ReportFormatOption[] = [
  { key: 'pdf', label: 'PDF', ext: '.pdf', desc: 'Portable, print-ready' },
  { key: 'docx', label: 'Word', ext: '.docx', desc: 'Microsoft Word document' },
  { key: 'xlsx', label: 'Excel', ext: '.xlsx', desc: 'Spreadsheet with data' },
  { key: 'csv', label: 'CSV', ext: '.csv', desc: 'Plain comma-separated' },
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

export const DATE_RANGE_PRESETS: readonly DateRangePreset[] = [
  {
    label: 'This month',
    range: (now = new Date()) => ({
      from: format(startOfMonth(now), 'yyyy-MM-dd'),
      to: format(endOfMonth(now), 'yyyy-MM-dd'),
    }),
  },
  {
    label: 'Last month',
    range: (now = new Date()) => {
      const d = subMonths(now, 1);
      return {
        from: format(startOfMonth(d), 'yyyy-MM-dd'),
        to: format(endOfMonth(d), 'yyyy-MM-dd'),
      };
    },
  },
  {
    label: 'This year',
    range: (now = new Date()) => ({
      from: format(startOfYear(now), 'yyyy-MM-dd'),
      to: format(endOfYear(now), 'yyyy-MM-dd'),
    }),
  },
] as const;
