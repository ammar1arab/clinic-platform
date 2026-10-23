import type { DoctorTimeOffEntry } from '@clinic/types';

const DAY_MS = 86400000;

function isVacation(entry: DoctorTimeOffEntry) {
  return entry.kind === 'vacation';
}

/** Splits a practitioner's time-off blocks and counts vacation days in one calendar year. */
export function splitTimeOff(entries: DoctorTimeOffEntry[], year: number) {
  const yearStart = new Date(year, 0, 1).getTime();
  const yearEnd = new Date(year + 1, 0, 1).getTime();
  const vacations = entries.filter(isVacation);
  const vacationsThisYear = vacations.filter((entry) => new Date(entry.endDate).getTime() > yearStart);
  const vacationDays = vacationsThisYear.reduce((total, entry) => {
    const start = Math.max(new Date(entry.startDate).getTime(), yearStart);
    const end = Math.min(new Date(entry.endDate).getTime(), yearEnd);
    return end > start ? total + Math.round((end - start) / DAY_MS) : total;
  }, 0);

  return {
    vacations: vacationsThisYear,
    leaves: entries.filter((entry) => !isVacation(entry)),
    vacationDays,
  };
}
