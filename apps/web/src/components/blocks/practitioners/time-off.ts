import type { DoctorTimeOffEntry } from '@clinic/types';

const DAY_MS = 86400000;

export function isVacationEntry(entry: DoctorTimeOffEntry) {
  return entry.kind === 'vacation';
}

export function leaveEntries(entries: DoctorTimeOffEntry[]) {
  return entries.filter((entry) => !isVacationEntry(entry));
}

/** Vacations that touch the given calendar year, in their stored order. */
export function vacationsInYear(entries: DoctorTimeOffEntry[], year: number) {
  const yearStart = new Date(year, 0, 1).getTime();
  return entries.filter(
    (entry) => isVacationEntry(entry) && new Date(entry.endDate).getTime() > yearStart,
  );
}

/** Whole vacation days that fall inside the given calendar year. */
export function vacationDaysInYear(entries: DoctorTimeOffEntry[], year: number) {
  const yearStart = new Date(year, 0, 1).getTime();
  const yearEnd = new Date(year + 1, 0, 1).getTime();
  return vacationsInYear(entries, year).reduce((total, entry) => {
    const start = Math.max(new Date(entry.startDate).getTime(), yearStart);
    const end = Math.min(new Date(entry.endDate).getTime(), yearEnd);
    return end > start ? total + Math.round((end - start) / DAY_MS) : total;
  }, 0);
}
