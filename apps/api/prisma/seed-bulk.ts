import { randomUUID } from "crypto";
import {
  Prisma,
  type AppointmentStatus,
  type DiscountType,
  type SessionType,
} from "@prisma/client";

export const BULK_PATIENT_COUNT = 20;
export const BULK_REFERRAL_COUNT = 20;

const AVATAR_IDS = [1, 2, 3, 5, 7, 8, 11, 12, 13, 14, 16, 17, 18, 22, 26];

const MALE_FIRST_EN = [
  "Ahmad",
  "Yousef",
  "Khaled",
  "Tariq",
  "Rami",
  "Fadi",
  "Zaid",
  "Samir",
  "Hasan",
  "Basel",
  "Omar",
  "Walid",
  "Issa",
  "Anas",
  "Laith",
  "Majed",
  "Nader",
  "Sami",
  "Hamza",
  "Ziad",
];
const FEMALE_FIRST_EN = [
  "Layla",
  "Noor",
  "Maya",
  "Hala",
  "Sara",
  "Dina",
  "Rana",
  "Lina",
  "Farah",
  "Nadia",
  "Jana",
  "Reem",
  "Dana",
  "Salma",
  "Amal",
  "Rania",
  "Huda",
  "Yasmin",
  "Abeer",
  "Sawsan",
];
const MALE_FIRST_AR = [
  "أحمد",
  "يوسف",
  "خالد",
  "طارق",
  "رامي",
  "فادي",
  "زيد",
  "سمير",
  "حسن",
  "باسل",
  "عمر",
  "وليد",
  "عيسى",
  "أنس",
  "ليث",
  "ماجد",
  "نادر",
  "سامي",
  "حمزة",
  "زياد",
];
const FEMALE_FIRST_AR = [
  "ليلى",
  "نور",
  "مايا",
  "هالة",
  "سارة",
  "دينا",
  "رنا",
  "لينا",
  "فرح",
  "نادية",
  "جنى",
  "ريم",
  "دانا",
  "سلمى",
  "أمل",
  "رانيا",
  "هدى",
  "ياسمين",
  "عبير",
  "سوسن",
];
const LAST_EN = [
  "Al-Masri",
  "Haddad",
  "Nasser",
  "Khoury",
  "Saleh",
  "Qasim",
  "Barakat",
  "Awad",
  "Hamdan",
  "Zoubi",
  "Taha",
  "Jaber",
  "Mansour",
  "Tarawneh",
  "Obeidat",
  "Rawashdeh",
  "Al-Khatib",
  "Shatnawi",
  "Momani",
  "Freij",
];
const LAST_AR = [
  "المصري",
  "حداد",
  "ناصر",
  "خوري",
  "صالح",
  "قاسم",
  "بركات",
  "عوض",
  "حمدان",
  "الزعبي",
  "طه",
  "جابر",
  "منصور",
  "الطراونة",
  "العبيدات",
  "الرواشدة",
  "الخطيب",
  "الشطناوي",
  "المومني",
  "فريج",
];
const CITIES = [
  { en: "Amman", ar: "عمّان" },
  { en: "Irbid", ar: "إربد" },
  { en: "Zarqa", ar: "الزرقاء" },
  { en: "Salt", ar: "السلط" },
  { en: "Madaba", ar: "مادبا" },
  { en: "Jerash", ar: "جرش" },
  { en: "Aqaba", ar: "العقبة" },
];
const BLOODS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const ALLERGIES = [
  null,
  null,
  "Penicillin",
  "Dust",
  "Peanuts",
  "Latex",
  "Pollen",
] as const;

function pick<T>(arr: readonly T[], i: number): T {
  const item = arr[((i % arr.length) + arr.length) % arr.length];
  if (item === undefined) throw new Error("pick: empty array");
  return item;
}

function jordanPhone(i: number, base: number, prefix: "79" | "77" | "78") {
  return `+962${prefix}${String(base + i * 137)
    .slice(-7)
    .padStart(7, "0")}`;
}

function nationalId(i: number, birthYear: number) {
  const yy = String(birthYear).slice(-2);
  return `${yy}${String(10000000 + i * 7919).slice(0, 8)}`;
}

function avatarUrl(i: number) {
  return `/avatars/avatar-${AVATAR_IDS[i % AVATAR_IDS.length]}-v2.webp`;
}

export type BulkPatientRow = {
  id: string;
  clinicId: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameAr: string;
  lastNameAr: string;
  nationalId: string;
  phone: string;
  email: string;
  dob: Date;
  gender: string;
  bloodType: string;
  allergies: string | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
  address: string;
  imageUrl: string;
  primaryDoctorId: string;
  packageId: string | null;
  discountCodeId: string | null;
  isActive: boolean;
};

export type BulkEnrollmentRow = {
  id: string;
  clinicId: string;
  patientId: string;
  packageId: string;
  sessionsTotal: number | null;
  creditTotal: Prisma.Decimal | null;
  notes: string;
};

export type BulkAppointmentRow = Prisma.AppointmentUncheckedCreateInput;

export function buildBulkPatients(params: {
  clinicId: string;
  doctorIds: string[];
  packageIds: string[];
  codeIds: string[];
}): BulkPatientRow[] {
  const { clinicId, doctorIds, packageIds, codeIds } = params;
  const rows: BulkPatientRow[] = [];

  for (let i = 0; i < BULK_PATIENT_COUNT; i++) {
    const female = i % 2 === 1;
    const fn = pick(female ? FEMALE_FIRST_EN : MALE_FIRST_EN, i);
    const fnAr = pick(female ? FEMALE_FIRST_AR : MALE_FIRST_AR, i);
    const ln = pick(LAST_EN, i * 3 + 1);
    const lnAr = pick(LAST_AR, i * 3 + 1);
    const city = pick(CITIES, i);
    const birthYear = 1955 + (i % 50);
    const prefix = (["79", "77", "78"] as const)[i % 3];

    rows.push({
      id: randomUUID(),
      clinicId,
      firstNameEn: fn,
      lastNameEn: ln,
      firstNameAr: fnAr,
      lastNameAr: lnAr,
      nationalId: nationalId(i, birthYear),
      phone: jordanPhone(i, 2_100_000, prefix),
      email: `${fn.toLowerCase()}.${ln.toLowerCase().replace(/[^a-z]/g, "")}.${i}@demo.local`,
      dob: new Date(Date.UTC(birthYear, i % 12, (i % 27) + 1)),
      gender: female ? "female" : "male",
      bloodType: pick(BLOODS, i),
      allergies: pick(ALLERGIES, i),
      emergencyContactName: female
        ? `Mrs. ${pick(LAST_EN, i + 5)}`
        : `Mr. ${pick(LAST_EN, i + 5)}`,
      emergencyContactPhone: jordanPhone(
        i,
        3_200_000,
        prefix === "79" ? "78" : "79",
      ),
      address: `${city.en} — ${pick(["Abdali", "Jabal Amman", "Sweifieh", "Khalda", "Marj Al-Hamam"], i)} St ${(i % 80) + 1}, Bldg ${(i % 20) + 1}`,
      imageUrl: avatarUrl(i),
      primaryDoctorId: pick(doctorIds, i),
      packageId: i % 4 === 0 ? pick(packageIds, i) : null,
      discountCodeId: i % 7 === 0 ? pick(codeIds, i) : null,
      isActive: i % 37 !== 0,
    });
  }

  return rows;
}

export function buildBulkEnrollments(params: {
  clinicId: string;
  patients: BulkPatientRow[];
  packages: Array<{
    id: string;
    sessionCount: number | null;
    price: Prisma.Decimal | null;
  }>;
}): BulkEnrollmentRow[] {
  const rows: BulkEnrollmentRow[] = [];
  for (let i = 0; i < params.patients.length; i++) {
    if (i % 3 !== 0) continue;
    const patient = params.patients[i];
    const pkg = pick(params.packages, i);
    const isSession = pkg.sessionCount != null;
    rows.push({
      id: randomUUID(),
      clinicId: params.clinicId,
      patientId: patient.id,
      packageId: pkg.id,
      sessionsTotal: isSession ? pkg.sessionCount : null,
      creditTotal: isSession ? null : (pkg.price ?? new Prisma.Decimal(0)),
      notes: "Demo enrollment",
    });
  }
  return rows;
}

type DoctorRef = { id: string; userId: string };
type ServiceRef = {
  id: string;
  departmentId: string | null;
  durationMins: number;
  fee: Prisma.Decimal;
  supportedModes: SessionType[];
};
type RoomRef = { id: string; departmentId: string | null };

function statusForDay(day: number, slot: number): AppointmentStatus {
  if (day < -14) {
    return pick(
      ["completed", "completed", "completed", "no_show", "cancelled"],
      slot,
    );
  }
  if (day < 0) {
    return pick(
      ["completed", "completed", "no_show", "cancelled", "confirmed"],
      slot + day,
    );
  }
  if (day === 0) {
    return pick(
      ["checked_in", "waiting", "in_progress", "confirmed", "completed"],
      slot,
    );
  }
  return pick(["unconfirmed", "confirmed", "confirmed"], slot);
}

export function buildBulkAppointments(params: {
  clinicId: string;
  patients: BulkPatientRow[];
  services: ServiceRef[];
  doctors: DoctorRef[];
  doctorsByDept: Map<string, DoctorRef[]>;
  rooms: RoomRef[];
  departments: Array<{ id: string; isActive: boolean }>;
  enrollments: BulkEnrollmentRow[];
  packages: Array<{ id: string; name: string }>;
  payMethods: Array<{ id: string }>;
  codes: Array<{ id: string }>;
  payerId: string;
  daysFromNow: (offset: number, hour?: number, minute?: number) => Date;
  now: Date;
}): BulkAppointmentRow[] {
  const enrollmentMeta = new Map(
    params.enrollments.map((e) => {
      const pkg = params.packages.find((p) => p.id === e.packageId);
      return [
        e.patientId,
        {
          ...e,
          packageName: pkg?.name ?? "Demo",
          isSession: e.sessionsTotal != null,
        },
      ] as const;
    }),
  );

  const rows: BulkAppointmentRow[] = [];
  let apptCount = 0;

  for (let day = -7; day <= 7; day++) {
    const perDay = 2;
    for (let slot = 0; slot < perDay; slot++) {
      const patient = pick(params.patients, apptCount);
      const service = pick(params.services, apptCount);
      const deptId =
        service.departmentId ?? params.departments.find((d) => d.isActive)?.id;
      if (!deptId) throw new Error("No department for appointment");

      const deptDoctors = params.doctorsByDept.get(deptId);
      const doctor = pick(
        deptDoctors?.length ? deptDoctors : params.doctors,
        apptCount + slot,
      );
      const roomCandidates = params.rooms.filter(
        (r) => r.departmentId === deptId,
      );
      const online =
        service.supportedModes.includes("online") && slot % 6 === 0;
      const hour = 8 + (slot % 9);
      const minute = slot % 2 === 0 ? 0 : 30;
      const scheduledAt = params.daysFromNow(day, hour, minute);
      const status = statusForDay(day, apptCount + slot);
      const isTerminalMiss = status === "cancelled" || status === "no_show";

      const fee = Number(service.fee);
      let discount: number | null = null;
      let discountType: DiscountType | null = null;
      let discountReason: string | null = null;
      let discountCodeId: string | null = null;
      if (apptCount % 6 === 0) {
        discount = 10;
        discountType = "percentage";
        discountReason = "Demo loyalty";
      } else if (apptCount % 9 === 0) {
        discount = 5;
        discountType = "fixed";
        discountReason = "Code: FLAT5";
        discountCodeId = params.codes[1]?.id ?? null;
      }

      const payable =
        discountType === "percentage"
          ? Math.max(fee - (fee * (discount ?? 0)) / 100, 0)
          : Math.max(fee - (discount ?? 0), 0);

      let waitingStartedAt: Date | null = null;
      let inProgressAt: Date | null = null;
      let waitingMins: number | null = null;
      if (status === "waiting" || status === "checked_in") {
        waitingStartedAt = scheduledAt;
      }
      if (status === "in_progress" || status === "completed") {
        waitingStartedAt = scheduledAt;
        inProgressAt = new Date(
          scheduledAt.getTime() + (12 + (apptCount % 35)) * 60_000,
        );
        waitingMins = Math.max(
          0,
          Math.floor(
            (inProgressAt.getTime() - waitingStartedAt.getTime()) / 60_000,
          ),
        );
      }

      const enrollment = enrollmentMeta.get(patient.id);
      const activeEnrollment =
        enrollment &&
        (status === "completed" || status === "in_progress") &&
        apptCount % 4 === 0
          ? enrollment
          : null;
      const usePackage = activeEnrollment != null;
      const isPaid =
        usePackage ||
        status === "completed" ||
        (status === "in_progress" && apptCount % 2 === 0);
      const recordPayment = isPaid && !isTerminalMiss;

      rows.push({
        id: randomUUID(),
        clinicId: params.clinicId,
        patientId: patient.id,
        doctorId: doctor.id,
        departmentId: deptId,
        roomId: online
          ? null
          : pick(roomCandidates.length ? roomCandidates : params.rooms, slot)
              .id,
        serviceId: service.id,
        scheduledAt,
        durationMins: service.durationMins,
        sessionType: online ? "online" : "in_person",
        meetingUrl: online ? "https://meet.example.com/demo-room" : null,
        status,
        statusUpdatedAt: params.now,
        statusUpdatedBy: doctor.userId,
        waitingStartedAt,
        inProgressAt,
        waitingMins,
        cancelReason:
          status === "cancelled" ? "Patient requested reschedule" : null,
        notes: apptCount % 11 === 0 ? "Demo clinical note" : null,
        fee: new Prisma.Decimal(fee),
        discount: discount != null ? new Prisma.Decimal(discount) : null,
        discountType,
        discountReason,
        discountCodeId,
        isPaid: recordPayment,
        paidAt: recordPayment ? (inProgressAt ?? params.now) : null,
        paidById: recordPayment ? params.payerId : null,
        paymentMethodId:
          recordPayment && !usePackage
            ? pick(params.payMethods, apptCount).id
            : null,
        paymentMethod: activeEnrollment
          ? `Package: ${activeEnrollment.packageName}`
          : null,
        patientPackageId: activeEnrollment?.id ?? null,
        packageCredit:
          activeEnrollment && !activeEnrollment.isSession
            ? new Prisma.Decimal(payable)
            : null,
      });
      apptCount++;
    }
  }

  return rows;
}

export function buildBulkReferrals(params: {
  clinicId: string;
  appointments: BulkAppointmentRow[];
  doctorIds: string[];
}): Prisma.ReferralUncheckedCreateInput[] {
  const rows: Prisma.ReferralUncheckedCreateInput[] = [];
  for (let i = 0; i < BULK_REFERRAL_COUNT; i++) {
    const appt = params.appointments[i * 45];
    if (!appt?.id) continue;
    const fromId = pick(params.doctorIds, i);
    const toId = pick(params.doctorIds, i + 3);
    if (fromId === toId) continue;
    rows.push({
      id: randomUUID(),
      clinicId: params.clinicId,
      appointmentId: appt.id,
      fromDoctorId: fromId,
      toDoctorId: toId,
      type: i % 2 === 0 ? "referral" : "consultation",
      urgency: pick(["normal", "high", "urgent"] as const, i),
      reason: "Demo referral for specialist review",
      opinion: i % 3 === 0 ? "Agree with plan" : null,
      status: pick(["pending", "accepted", "rejected"] as const, i),
    });
  }
  return rows;
}
