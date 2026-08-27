import { ReportDocument } from "./types/report-document";
import { formatPhoneDisplay } from "@/infrastructure";
import {
  formatDisplayDate,
  formatDisplayDateTime,
  slugFilename,
} from "./utils/report-format";

type ClinicLetterheadRow = {
  name: string;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  letterheadFooter: string | null;
};

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

function toNumber(
  value: { toString(): string } | number | null | undefined,
): number {
  if (value === null || value === undefined) return 0;
  return Number(value) || 0;
}

/** Mirrors web computePayable for report totals. */
function computePayable(
  fee: { toString(): string } | number | null | undefined,
  discount: { toString(): string } | number | null | undefined,
  discountType: string | null | undefined,
): { fee: number; discountAmount: number; payable: number } {
  const baseFee = toNumber(fee);
  const rawDiscount = toNumber(discount);
  let discountAmount = 0;
  if (rawDiscount > 0 && discountType) {
    discountAmount =
      discountType === "percentage"
        ? (baseFee * Math.min(rawDiscount, 100)) / 100
        : Math.min(rawDiscount, baseFee);
  }
  return {
    fee: baseFee,
    discountAmount,
    payable: Math.max(baseFee - discountAmount, 0),
  };
}

function formatMoney(n: number): string {
  return n.toFixed(3);
}

/** Builds normalized ReportDocument — no I/O, no format knowledge. */
export class ReportDocumentFactory {
  buildPatientMedical(input: PatientMedicalInput): ReportDocument {
    const { clinic, patient, appointments } = input;
    const nameEn = `${patient.firstNameEn} ${patient.lastNameEn}`.trim();
    const nameAr =
      patient.firstNameAr || patient.lastNameAr
        ? `${patient.firstNameAr ?? ""} ${patient.lastNameAr ?? ""}`.trim()
        : null;

    return {
      type: "patient_medical",
      title: `Patient Medical Report — ${nameEn}`,
      filenameBase: slugFilename(["patient", nameEn, patient.id.slice(0, 8)]),
      generatedAt: new Date(),
      letterhead: {
        clinicName: clinic.name,
        address: clinic.address,
        phone: formatPhoneDisplay(clinic.phone) || clinic.phone,
        logoUrl: clinic.logoUrl,
        footer: clinic.letterheadFooter,
      },
      summary: [
        { label: "Name (EN)", value: nameEn },
        { label: "Name (AR)", value: nameAr ?? "—" },
        { label: "National ID", value: patient.nationalId ?? "—" },
        {
          label: "Phone",
          value: formatPhoneDisplay(patient.phone) || patient.phone || "—",
        },
        { label: "Email", value: patient.email ?? "—" },
        {
          label: "Date of Birth",
          value: patient.dob ? formatDisplayDate(patient.dob) : "—",
        },
        { label: "Gender", value: patient.gender ?? "—" },
        { label: "Blood Type", value: patient.bloodType ?? "—" },
        {
          label: "Primary Doctor",
          value: patient.primaryDoctor?.name ?? "—",
        },
        { label: "Allergies", value: patient.allergies ?? "None recorded" },
        { label: "Address", value: patient.address ?? "—" },
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
      rows: appointments.map((a) => ({
        date: formatDisplayDateTime(a.scheduledAt),
        status: a.status,
        doctor: a.doctor.name,
        service: a.service?.name ?? null,
        department: a.department?.name ?? null,
        type: a.sessionType,
        duration: `${a.durationMins} min`,
      })),
    };
  }

  buildReferrals(input: {
    clinic: ClinicLetterheadRow;
    referrals: ReferralReportRow[];
    filtersLabel: string;
  }): ReportDocument {
    const { clinic, referrals, filtersLabel } = input;

    return {
      type: "referrals",
      title: "Referrals & Consultations Report",
      filenameBase: slugFilename(["referrals", filtersLabel || "all"]),
      generatedAt: new Date(),
      letterhead: {
        clinicName: clinic.name,
        address: clinic.address,
        phone: formatPhoneDisplay(clinic.phone) || clinic.phone,
        logoUrl: clinic.logoUrl,
        footer: clinic.letterheadFooter,
      },
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
      rows: referrals.map((r) => {
        const p = r.appointment.patient;
        return {
          createdAt: formatDisplayDateTime(r.createdAt),
          patient: `${p.firstNameEn} ${p.lastNameEn}`.trim(),
          nationalId: p.nationalId,
          type: r.type,
          urgency: r.urgency,
          status: r.status,
          fromDoctor: r.fromDoctor.name,
          toDoctor: r.toDoctor.name,
          reason: r.reason,
          opinion: r.opinion,
          appointmentAt: formatDisplayDateTime(r.appointment.scheduledAt),
        };
      }),
    };
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
    const byMethod = new Map<string, number>();
    const byDoctor = new Map<string, number>();

    const rows = appointments.map((a) => {
      const pricing = computePayable(a.fee, a.discount, a.discountType);
      const methodName =
        a.paymentMethodRef?.name ??
        a.paymentMethod ??
        (a.isPaid ? "Unknown" : "—");

      if (a.isPaid) {
        paidCount += 1;
        paidRevenue += pricing.payable;
        byMethod.set(
          methodName,
          (byMethod.get(methodName) ?? 0) + pricing.payable,
        );
        byDoctor.set(
          a.doctor.name,
          (byDoctor.get(a.doctor.name) ?? 0) + pricing.payable,
        );
      } else {
        unpaidCount += 1;
        unpaidOutstanding += pricing.payable;
      }

      return {
        date: formatDisplayDateTime(a.scheduledAt),
        patient: `${a.patient.firstNameEn} ${a.patient.lastNameEn}`.trim(),
        nationalId: a.patient.nationalId,
        doctor: a.doctor.name,
        service: a.service?.name ?? null,
        status: a.status,
        fee: Number(pricing.fee.toFixed(3)),
        discount: Number(pricing.discountAmount.toFixed(3)),
        payable: Number(pricing.payable.toFixed(3)),
        paid: a.isPaid ? "Paid" : "Unpaid",
        paymentMethod: methodName,
        paidAt: a.paidAt ? formatDisplayDateTime(a.paidAt) : null,
      };
    });

    const methodSummary =
      byMethod.size > 0
        ? [...byMethod.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([name, total]) => `${name}: ${formatMoney(total)}`)
            .join(" · ")
        : "—";

    const doctorSummary =
      byDoctor.size > 0
        ? [...byDoctor.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([name, total]) => `${name}: ${formatMoney(total)}`)
            .join(" · ")
        : "—";

    return {
      type: "finance_monthly",
      title: "Finance Report",
      filenameBase: slugFilename(["finance", periodLabel || "all"]),
      generatedAt: new Date(),
      letterhead: {
        clinicName: clinic.name,
        address: clinic.address,
        phone: formatPhoneDisplay(clinic.phone) || clinic.phone,
        logoUrl: clinic.logoUrl,
        footer: clinic.letterheadFooter,
      },
      summary: [
        { label: "Period", value: periodLabel || "All dates" },
        { label: "Appointments", value: String(appointments.length) },
        { label: "Paid", value: String(paidCount) },
        { label: "Unpaid", value: String(unpaidCount) },
        { label: "Revenue (paid)", value: formatMoney(paidRevenue) },
        {
          label: "Outstanding (unpaid)",
          value: formatMoney(unpaidOutstanding),
        },
        { label: "By payment method", value: methodSummary },
        { label: "By doctor", value: doctorSummary },
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
      rows,
    };
  }
}
