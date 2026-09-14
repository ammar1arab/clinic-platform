import { formatPhoneDisplay } from "@/infrastructure";
import { ReportDocument } from "./types/report-document";
import {
  appointmentPerformance,
  ClinicLetterheadRow,
  moneyLine,
  reportDocument,
  tally,
} from "./report-document.helpers";
import {
  blank,
  cell,
  formatDisplayDate,
  formatDisplayDateTime,
  patientName,
  sortHourSlots,
  weekdayName,
} from "./utils/report-format";

type PatientMedicalInput = {
  clinic: ClinicLetterheadRow;
  patient: {
    id: string;
    firstNameEn: string;
    lastNameEn: string;
    firstNameAr: string | null;
    lastNameAr: string | null;
    nationalId: string | null;
    phone: string | null;
    email: string | null;
    dob: Date | null;
    gender: string | null;
    bloodType: string | null;
    allergies: string | null;
    address: string | null;
    primaryDoctor: { name: string } | null;
  };
  appointments: Array<{
    scheduledAt: Date;
    status: string;
    sessionType: string;
    durationMins: number;
    doctor: { name: string };
    service: { name: string } | null;
    department: { name: string } | null;
  }>;
};

type ReferralReportRow = {
  createdAt: Date;
  type: string;
  urgency: string;
  status: string;
  reason: string;
  opinion: string | null;
  fromDoctor: { name: string };
  toDoctor: { name: string };
  appointment: {
    scheduledAt: Date;
    patient: {
      firstNameEn: string;
      lastNameEn: string;
      nationalId: string | null;
    };
  };
};

type FinanceAppointmentRow = {
  scheduledAt: Date;
  status: string;
  fee: { toString(): string } | number | null;
  discount: { toString(): string } | number | null;
  discountType: string | null;
  isPaid: boolean;
  paidAt: Date | null;
  paymentMethod: string | null;
  patient: {
    firstNameEn: string;
    lastNameEn: string;
    nationalId: string | null;
  };
  doctor: { name: string };
  service: { name: string } | null;
  paymentMethodRef: { name: string } | null;
};

type DirectoryPatientRow = {
  firstNameEn: string;
  lastNameEn: string;
  phone?: string | null;
  email?: string | null;
  nationalId?: string | null;
  gender?: string | null;
  bloodType?: string | null;
  dob?: Date | string | null;
  primaryDoctorName?: string | null;
  totalSessions?: number;
  firstVisit?: Date | string | null;
  lastVisit?: Date | string | null;
  isActive: boolean;
};

type DirectoryPractitionerRow = {
  name: string;
  nameAr?: string | null;
  title?: string | null;
  email: string;
  phone?: string | null;
  departmentName?: string | null;
  specialty?: string | null;
  employmentType?: string | null;
  languages: string[];
  licenseNumber?: string | null;
  licenseExpiry?: string | null;
  experienceYears?: number | null;
  defaultRoomName?: string | null;
  gender?: string | null;
  nationality?: string | null;
  isActive: boolean;
};

type AppointmentReportRow = {
  scheduledAt: Date;
  status: string;
  sessionType: string;
  durationMins: number;
  patient: {
    firstNameEn: string;
    lastNameEn: string;
    nationalId?: string | null;
  };
  doctor: { name: string };
  service?: { name: string } | null;
  room?: { name: string } | null;
};

type HourSlot = { dayOfWeek: number; startTime: string; endTime: string };

type PractitionerProfileInput = {
  name: string;
  nameAr?: string | null;
  title?: string | null;
  email: string;
  phone?: string | null;
  specialty?: string | null;
  departmentName?: string | null;
  defaultRoomName?: string | null;
  employmentType?: string | null;
  languages: string[];
  licenseNumber?: string | null;
  licenseExpiry?: string | null;
  experienceYears?: number | null;
  services?: Array<{ name: string; durationMins: number; fee: string }>;
  availabilities?: HourSlot[];
};

function phone(value?: string | null) {
  return formatPhoneDisplay(value) || value || "-";
}

function activeLabel(isActive: boolean) {
  return isActive ? "Active" : "Inactive";
}

export class ReportDocumentFactory {
  buildPatientMedical(input: PatientMedicalInput): ReportDocument {
    const { clinic, patient, appointments } = input;
    const nameEn = patientName(patient);
    const nameAr = patientName({
      firstNameEn: patient.firstNameAr,
      lastNameEn: patient.lastNameAr,
    });

    return reportDocument({
      type: "patient_medical",
      title: `Patient Medical Report - ${nameEn}`,
      filename: ["patient", nameEn, patient.id.slice(0, 8)],
      clinic,
      summary: [
        { label: "Name (EN)", value: nameEn },
        { label: "Name (AR)", value: blank(nameAr) },
        { label: "National ID", value: blank(patient.nationalId) },
        { label: "Phone", value: phone(patient.phone) },
        { label: "Email", value: blank(patient.email) },
        {
          label: "Date of Birth",
          value: patient.dob ? formatDisplayDate(patient.dob) : "-",
        },
        { label: "Gender", value: blank(patient.gender) },
        { label: "Blood Type", value: blank(patient.bloodType) },
        { label: "Primary Doctor", value: blank(patient.primaryDoctor?.name) },
        { label: "Allergies", value: patient.allergies ?? "None recorded" },
        { label: "Address", value: blank(patient.address) },
        { label: "Total Visits", value: String(appointments.length) },
      ],
      columns: [
        { key: "date", header: "Date" },
        { key: "status", header: "Status" },
        { key: "doctor", header: "Doctor" },
        { key: "service", header: "Service" },
        { key: "department", header: "Department" },
        { key: "type", header: "Type" },
        { key: "duration", header: "Duration" },
      ],
      rows: appointments.map((row) => ({
        date: formatDisplayDateTime(row.scheduledAt),
        status: row.status,
        doctor: row.doctor.name,
        service: row.service?.name ?? null,
        department: row.department?.name ?? null,
        type: row.sessionType,
        duration: `${row.durationMins} min`,
      })),
    });
  }

  buildReferrals(input: {
    clinic: ClinicLetterheadRow;
    referrals: ReferralReportRow[];
    filtersLabel: string;
  }): ReportDocument {
    const { clinic, referrals, filtersLabel } = input;
    return reportDocument({
      type: "referrals",
      title: "Referrals & Consultations Report",
      filename: ["referrals", filtersLabel || "all"],
      clinic,
      summary: [
        { label: "Filters", value: filtersLabel || "All referrals" },
        { label: "Total records", value: String(referrals.length) },
      ],
      columns: [
        { key: "createdAt", header: "Created" },
        { key: "patient", header: "Patient" },
        { key: "nationalId", header: "National ID" },
        { key: "type", header: "Type" },
        { key: "urgency", header: "Urgency" },
        { key: "status", header: "Status" },
        { key: "fromDoctor", header: "From" },
        { key: "toDoctor", header: "To" },
        { key: "reason", header: "Reason" },
        { key: "opinion", header: "Opinion" },
        { key: "appointmentAt", header: "Appointment" },
      ],
      rows: referrals.map((row) => ({
        createdAt: formatDisplayDateTime(row.createdAt),
        patient: patientName(row.appointment.patient),
        nationalId: row.appointment.patient.nationalId,
        type: row.type,
        urgency: row.urgency,
        status: row.status,
        fromDoctor: row.fromDoctor.name,
        toDoctor: row.toDoctor.name,
        reason: row.reason,
        opinion: row.opinion,
        appointmentAt: formatDisplayDateTime(row.appointment.scheduledAt),
      })),
    });
  }

  buildFinanceMonthly(input: {
    clinic: ClinicLetterheadRow;
    appointments: FinanceAppointmentRow[];
    periodLabel: string;
  }): ReportDocument {
    const { clinic, appointments, periodLabel } = input;
    let paidRevenue = 0;
    let unpaidOutstanding = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    const rows = appointments.map((row) => {
      const pricing = moneyLine(row.fee, row.discount, row.discountType);
      const methodName =
        row.paymentMethodRef?.name ??
        row.paymentMethod ??
        (row.isPaid ? "Unknown" : "-");

      if (row.isPaid) {
        paidCount += 1;
        paidRevenue += pricing.payable;
      } else {
        unpaidCount += 1;
        unpaidOutstanding += pricing.payable;
      }

      return {
        date: formatDisplayDateTime(row.scheduledAt),
        patient: patientName(row.patient),
        nationalId: row.patient.nationalId,
        doctor: row.doctor.name,
        service: row.service?.name ?? null,
        status: row.status,
        fee: pricing.fee,
        discount: pricing.discount,
        payable: pricing.payable,
        paid: row.isPaid ? "Paid" : "Unpaid",
        paymentMethod: methodName,
        paidAt: row.paidAt ? formatDisplayDateTime(row.paidAt) : null,
        isPaid: row.isPaid,
        methodName,
        doctorName: row.doctor.name,
      };
    });

    return reportDocument({
      type: "finance_monthly",
      title: "Finance Report",
      filename: ["finance", periodLabel || "all"],
      clinic,
      summary: [
        { label: "Period", value: periodLabel || "All dates" },
        { label: "Appointments", value: String(appointments.length) },
        { label: "Paid", value: String(paidCount) },
        { label: "Unpaid", value: String(unpaidCount) },
        { label: "Revenue (paid)", value: paidRevenue.toFixed(3) },
        { label: "Outstanding (unpaid)", value: unpaidOutstanding.toFixed(3) },
        {
          label: "By payment method",
          value: tally(rows, (row) =>
            row.isPaid ? [row.methodName, row.payable] : null,
          ),
        },
        {
          label: "By doctor",
          value: tally(rows, (row) =>
            row.isPaid ? [row.doctorName, row.payable] : null,
          ),
        },
      ],
      columns: [
        { key: "date", header: "Date" },
        { key: "patient", header: "Patient" },
        { key: "nationalId", header: "National ID" },
        { key: "doctor", header: "Doctor" },
        { key: "service", header: "Service" },
        { key: "status", header: "Status" },
        { key: "fee", header: "Fee" },
        { key: "discount", header: "Discount" },
        { key: "payable", header: "Payable" },
        { key: "paid", header: "Payment" },
        { key: "paymentMethod", header: "Method" },
        { key: "paidAt", header: "Paid at" },
      ],
      rows: rows.map(
        ({ isPaid: _paid, methodName: _method, doctorName: _doctor, ...row }) =>
          row,
      ),
    });
  }

  buildPatientsDirectory(input: {
    clinic: ClinicLetterheadRow;
    patients: DirectoryPatientRow[];
    filtersLabel: string;
  }): ReportDocument {
    const { clinic, patients, filtersLabel } = input;
    return reportDocument({
      type: "patients_directory",
      title: "Patients Directory",
      filename: ["patients-directory", filtersLabel || "all"],
      clinic,
      summary: [
        { label: "Filters", value: filtersLabel || "All patients" },
        { label: "Total records", value: String(patients.length) },
      ],
      columns: [
        { key: "name", header: "Name" },
        { key: "phone", header: "Phone" },
        { key: "email", header: "Email" },
        { key: "nationalId", header: "National ID" },
        { key: "gender", header: "Gender" },
        { key: "bloodType", header: "Blood type" },
        { key: "dob", header: "Date of birth" },
        { key: "primaryDoctor", header: "Primary doctor" },
        { key: "sessions", header: "Sessions" },
        { key: "firstVisit", header: "First visit" },
        { key: "lastVisit", header: "Last visit" },
        { key: "status", header: "Status" },
      ],
      rows: patients.map((patient) => ({
        name: patientName(patient),
        phone: cell(formatPhoneDisplay(patient.phone) || patient.phone),
        email: cell(patient.email),
        nationalId: cell(patient.nationalId),
        gender: cell(patient.gender),
        bloodType: cell(patient.bloodType),
        dob: patient.dob ? formatDisplayDate(patient.dob) : null,
        primaryDoctor: cell(patient.primaryDoctorName),
        sessions: patient.totalSessions ?? 0,
        firstVisit: patient.firstVisit
          ? formatDisplayDate(patient.firstVisit)
          : null,
        lastVisit: patient.lastVisit
          ? formatDisplayDate(patient.lastVisit)
          : null,
        status: activeLabel(patient.isActive),
      })),
    });
  }

  buildPractitionersDirectory(input: {
    clinic: ClinicLetterheadRow;
    practitioners: DirectoryPractitionerRow[];
    filtersLabel: string;
  }): ReportDocument {
    const { clinic, practitioners, filtersLabel } = input;
    return reportDocument({
      type: "practitioners_directory",
      title: "Practitioners Directory",
      filename: ["practitioners-directory", filtersLabel || "all"],
      clinic,
      summary: [
        { label: "Filters", value: filtersLabel || "All practitioners" },
        { label: "Total records", value: String(practitioners.length) },
      ],
      columns: [
        { key: "name", header: "Name" },
        { key: "nameAr", header: "Name (AR)" },
        { key: "email", header: "Email" },
        { key: "phone", header: "Phone" },
        { key: "department", header: "Department" },
        { key: "specialty", header: "Specialty" },
        { key: "employment", header: "Employment" },
        { key: "languages", header: "Languages" },
        { key: "license", header: "License" },
        { key: "licenseExpiry", header: "License expiry" },
        { key: "experience", header: "Experience" },
        { key: "room", header: "Room" },
        { key: "gender", header: "Gender" },
        { key: "nationality", header: "Nationality" },
        { key: "status", header: "Status" },
      ],
      rows: practitioners.map((row) => ({
        name: row.title ? `${row.title} ${row.name}` : row.name,
        nameAr: cell(row.nameAr),
        email: row.email,
        phone: cell(formatPhoneDisplay(row.phone) || row.phone),
        department: cell(row.departmentName),
        specialty: cell(row.specialty),
        employment: cell(row.employmentType),
        languages: row.languages.join(", "),
        license: cell(row.licenseNumber),
        licenseExpiry: row.licenseExpiry
          ? formatDisplayDate(row.licenseExpiry)
          : null,
        experience: cell(row.experienceYears),
        room: cell(row.defaultRoomName),
        gender: cell(row.gender),
        nationality: cell(row.nationality),
        status: activeLabel(row.isActive),
      })),
    });
  }

  buildPractitionerProfile(input: {
    clinic: ClinicLetterheadRow;
    practitioner: PractitionerProfileInput;
    appointments: Array<{ status: string }>;
  }): ReportDocument {
    const { clinic, practitioner, appointments } = input;
    const stats = appointmentPerformance(appointments);
    const hours = sortHourSlots(practitioner.availabilities ?? [])
      .map(
        (slot) =>
          `${weekdayName(slot.dayOfWeek)} ${slot.startTime}-${slot.endTime}`,
      )
      .join(" · ");

    return reportDocument({
      type: "practitioner_profile",
      title: `Practitioner Profile - ${practitioner.name}`,
      filename: ["practitioner", practitioner.name],
      clinic,
      summary: [
        { label: "Name", value: practitioner.name },
        { label: "Name (AR)", value: blank(practitioner.nameAr) },
        { label: "Title", value: blank(practitioner.title) },
        { label: "Email", value: practitioner.email },
        { label: "Phone", value: phone(practitioner.phone) },
        { label: "Specialty", value: blank(practitioner.specialty) },
        { label: "Department", value: blank(practitioner.departmentName) },
        { label: "Room", value: blank(practitioner.defaultRoomName) },
        { label: "Employment", value: blank(practitioner.employmentType) },
        {
          label: "Languages",
          value: practitioner.languages.join(", ") || "-",
        },
        { label: "License", value: blank(practitioner.licenseNumber) },
        {
          label: "License expiry",
          value: practitioner.licenseExpiry
            ? formatDisplayDate(practitioner.licenseExpiry)
            : "-",
        },
        {
          label: "Experience",
          value:
            practitioner.experienceYears != null
              ? `${practitioner.experienceYears} years`
              : "-",
        },
        { label: "Visits", value: String(stats.total) },
        { label: "Completed", value: String(stats.completed) },
        { label: "No-shows", value: String(stats.noShows) },
        { label: "Cancelled", value: String(stats.cancelled) },
        { label: "Weekly hours", value: hours || "-" },
      ],
      columns: [
        { key: "service", header: "Service" },
        { key: "duration", header: "Duration" },
        { key: "fee", header: "Fee" },
      ],
      rows: (practitioner.services ?? []).map((service) => ({
        service: service.name,
        duration: `${service.durationMins} min`,
        fee: service.fee,
      })),
    });
  }

  buildPractitionerHours(input: {
    clinic: ClinicLetterheadRow;
    practitionerName: string;
    availabilities: HourSlot[];
  }): ReportDocument {
    const rows = sortHourSlots(input.availabilities).map((slot) => ({
      day: weekdayName(slot.dayOfWeek),
      start: slot.startTime,
      end: slot.endTime,
    }));

    return reportDocument({
      type: "practitioner_hours",
      title: `Weekly Hours - ${input.practitionerName}`,
      filename: ["practitioner-hours", input.practitionerName],
      clinic: input.clinic,
      summary: [
        { label: "Practitioner", value: input.practitionerName },
        { label: "Blocks", value: String(rows.length) },
      ],
      columns: [
        { key: "day", header: "Day" },
        { key: "start", header: "Start" },
        { key: "end", header: "End" },
      ],
      rows,
    });
  }

  buildPractitionerExceptions(input: {
    clinic: ClinicLetterheadRow;
    practitionerName: string;
    timeOffs: Array<{
      startDate: string;
      endDate: string;
      reason?: string | null;
    }>;
    overrides: Array<{
      startAt: string;
      endAt: string;
      reason?: string | null;
    }>;
  }): ReportDocument {
    const { clinic, practitionerName, timeOffs, overrides } = input;
    return reportDocument({
      type: "practitioner_exceptions",
      title: `Leave & Extra Hours - ${practitionerName}`,
      filename: ["practitioner-exceptions", practitionerName],
      clinic,
      summary: [
        { label: "Practitioner", value: practitionerName },
        { label: "Leave blocks", value: String(timeOffs.length) },
        { label: "Extra hours", value: String(overrides.length) },
      ],
      columns: [
        { key: "kind", header: "Type" },
        { key: "start", header: "Start" },
        { key: "end", header: "End" },
        { key: "reason", header: "Reason" },
      ],
      rows: [
        ...timeOffs.map((entry) => ({
          kind: "Leave",
          start: formatDisplayDate(entry.startDate),
          end: formatDisplayDate(entry.endDate),
          reason: cell(entry.reason),
        })),
        ...overrides.map((entry) => ({
          kind: "Extra hours",
          start: formatDisplayDateTime(entry.startAt),
          end: formatDisplayDateTime(entry.endAt),
          reason: cell(entry.reason),
        })),
      ],
    });
  }

  buildAppointments(input: {
    clinic: ClinicLetterheadRow;
    appointments: AppointmentReportRow[];
    title: string;
    filenameBase: string;
    filtersLabel: string;
    type: "practitioner_appointments" | "clinic_appointments";
  }): ReportDocument {
    const stats = appointmentPerformance(input.appointments);
    return reportDocument({
      type: input.type,
      title: input.title,
      filename: [input.filenameBase, input.filtersLabel || "all"],
      clinic: input.clinic,
      summary: [
        { label: "Filters", value: input.filtersLabel || "All dates" },
        { label: "Appointments", value: String(stats.total) },
        { label: "Completed", value: String(stats.completed) },
        { label: "No-shows", value: String(stats.noShows) },
        { label: "Cancelled", value: String(stats.cancelled) },
      ],
      columns: [
        { key: "date", header: "Date" },
        { key: "patient", header: "Patient" },
        { key: "doctor", header: "Doctor" },
        { key: "service", header: "Service" },
        { key: "room", header: "Room" },
        { key: "status", header: "Status" },
        { key: "type", header: "Type" },
        { key: "duration", header: "Duration" },
      ],
      rows: input.appointments.map((row) => ({
        date: formatDisplayDateTime(row.scheduledAt),
        patient: patientName(row.patient),
        doctor: row.doctor.name,
        service: row.service?.name ?? null,
        room: row.room?.name ?? null,
        status: row.status,
        type: row.sessionType,
        duration: `${row.durationMins} min`,
      })),
    });
  }
}
