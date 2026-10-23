import { randomBytes } from "node:crypto";
import { REPORT_TYPE, type ReportDetails, type ReportType } from "@clinic/types";
import { visitError } from "./visit-errors";

interface StoredReportDetails {
  reportType: string;
  restFrom: Date | null;
  restTo: Date | null;
  purpose: string;
  referenceNumber: string;
}

const toIsoDate = (value: Date | null) =>
  value ? value.toISOString().slice(0, 10) : null;

const toDbDate = (value: string | null) =>
  value ? new Date(`${value}T00:00:00.000Z`) : null;

export const newReferenceNumber = () =>
  `MR-${randomBytes(4).toString("hex").toUpperCase()}`;

export function storedReportDetails(row: StoredReportDetails): ReportDetails {
  return {
    reportType: row.reportType as ReportType,
    restFrom: toIsoDate(row.restFrom),
    restTo: toIsoDate(row.restTo),
    purpose: row.purpose,
  };
}

// Rest dates only apply to sick leave reports; other types never store them.
export function normalizeReportDetails(input: ReportDetails): ReportDetails {
  const sick = input.reportType === REPORT_TYPE.SICK_LEAVE;
  return {
    reportType: input.reportType,
    restFrom: sick ? input.restFrom : null,
    restTo: sick ? input.restTo : null,
    purpose: input.purpose.trim(),
  };
}

export function assertReportDetails(details: ReportDetails) {
  if (details.reportType !== REPORT_TYPE.SICK_LEAVE) return;
  if (
    !details.restFrom ||
    !details.restTo ||
    details.restTo < details.restFrom
  )
    visitError("visitReportRestDatesInvalid");
}

export const reportDetailsData = (details: ReportDetails) => ({
  reportType: details.reportType,
  restFrom: toDbDate(details.restFrom),
  restTo: toDbDate(details.restTo),
  purpose: details.purpose,
});

export function restDays(details: ReportDetails) {
  if (!details.restFrom || !details.restTo) return 0;
  const span =
    Date.parse(`${details.restTo}T00:00:00Z`) -
    Date.parse(`${details.restFrom}T00:00:00Z`);
  return Math.round(span / 86400000) + 1;
}
