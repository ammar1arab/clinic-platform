import "dotenv/config";
import {
  PrismaClient,
  Prisma,
  AppointmentStatus,
  type Department,
  type Room,
  type Service,
  type PaymentMethod,
  type Patient,
  type PatientPackage,
  type Appointment,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcrypt";

const DEMO_PASSWORD = "Demo123!";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function daysFromNow(offset: number, hour = 9, minute = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function pick<T>(arr: readonly T[], i: number): T {
  if (arr.length === 0) throw new Error("pick: empty array");
  const item = arr[i % arr.length];
  if (item === undefined) throw new Error("pick: missing item");
  return item;
}

async function resetClinicOperationalData(clinicId: string) {
  await prisma.notification.deleteMany({ where: { clinicId } });
  await prisma.referral.deleteMany({ where: { clinicId } });
  await prisma.appointment.deleteMany({ where: { clinicId } });
  await prisma.patientPackage.deleteMany({ where: { clinicId } });
  await prisma.patient.deleteMany({ where: { clinicId } });

  const staff = await prisma.clinicUser.findMany({
    where: { clinicId },
    select: { id: true },
  });
  const staffIds = staff.map((s) => s.id);
  if (staffIds.length) {
    await prisma.clinicUserService.deleteMany({
      where: { clinicUserId: { in: staffIds } },
    });
    await prisma.doctorTimeOff.deleteMany({
      where: { doctorId: { in: staffIds } },
    });
    await prisma.doctorAvailability.deleteMany({
      where: { doctorId: { in: staffIds } },
    });
  }

  await prisma.discountCode.deleteMany({ where: { clinicId } });
  await prisma.package.deleteMany({ where: { clinicId } });
  await prisma.paymentMethod.deleteMany({ where: { clinicId } });
  await prisma.service.deleteMany({ where: { clinicId } });
  await prisma.room.deleteMany({ where: { clinicId } });
  await prisma.department.deleteMany({ where: { clinicId } });
}

async function ensureExtraStaff(clinicId: string) {
  const existing = await prisma.clinicUser.findMany({
    where: { clinicId, isActive: true },
  });
  const practitioners = existing.filter((u) =>
    ["owner", "admin", "practitioner"].includes(u.role),
  );
  if (practitioners.length >= 3) return practitioners;

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const extras = [
    {
      email: "dr.sara.demo@clinic.local",
      name: "Dr. Sara Haddad",
      role: "practitioner" as const,
    },
    {
      email: "dr.omar.demo@clinic.local",
      name: "Dr. Omar Nasser",
      role: "practitioner" as const,
    },
    {
      email: "finance.demo@clinic.local",
      name: "Lina Finance",
      role: "financial" as const,
    },
  ];

  const created = [...practitioners];
  for (const e of extras) {
    if (created.length >= 4) break;
    let user = await prisma.user.findUnique({ where: { email: e.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: e.email,
          passwordHash,
          mustChangePassword: false,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, mustChangePassword: false },
      });
    }
    const cu =
      (await prisma.clinicUser.findFirst({
        where: { userId: user.id, clinicId },
      })) ??
      (await prisma.clinicUser.create({
        data: {
          userId: user.id,
          clinicId,
          role: e.role,
          name: e.name,
          title: e.role === "practitioner" ? "Dr" : null,
          initials: e.name
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 3),
          phone: `+96279${String(1000000 + created.length).slice(0, 7)}`,
          employmentType: e.role === "practitioner" ? "salaried" : null,
          calendarColor:
            e.role === "practitioner"
              ? pick(
                  ["brand", "accent-teal", "primary", "success"] as const,
                  created.length,
                )
              : null,
          bufferMins: e.role === "practitioner" ? 10 : 0,
        },
      }));
    if (!created.find((c) => c.id === cu.id)) created.push(cu);
  }
  return created;
}

async function resolveClinic() {
  if (process.env.SEED_CLINIC_ID) {
    const byId = await prisma.clinic.findUnique({
      where: { id: process.env.SEED_CLINIC_ID },
    });
    if (!byId) {
      throw new Error(
        `SEED_CLINIC_ID not found: ${process.env.SEED_CLINIC_ID}`,
      );
    }
    return byId;
  }

  const clinics = await prisma.clinic.findMany({
    include: {
      users: { include: { user: { select: { email: true } } } },
      _count: { select: { users: true, patients: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (clinics.length === 0) return null;

  console.log("Available clinics:");
  for (const c of clinics) {
    const emails = c.users.map((u) => u.user.email).join(", ");
    console.log(
      `  - ${c.name} (${c.id}) staff=${c._count.users} patients=${c._count.patients} [${emails}]`,
    );
  }

  const preferred =
    clinics.find((c) =>
      c.users.some((u) => u.user.email.toLowerCase() === "owner@clinic.com"),
    ) ?? [...clinics].sort((a, b) => b._count.users - a._count.users)[0];

  return preferred;
}

async function main() {
  const clinic = await resolveClinic();

  if (!clinic) {
    throw new Error(
      "No clinic found. Register/login once to create a clinic, then re-run: npm run seed",
    );
  }

  console.log(`\nSeeding clinic: ${clinic.name} (${clinic.id})`);
  await resetClinicOperationalData(clinic.id);
  console.log("Cleared operational data");

  const staff = await ensureExtraStaff(clinic.id);
  const doctors = staff.filter((s) =>
    ["owner", "admin", "practitioner"].includes(s.role),
  );
  const payer = staff.find((s) => s.role === "financial") ?? staff[0];
  console.log(`Staff ready: ${staff.length} (doctors: ${doctors.length})`);

  const deptDefs = [
    { name: "General Medicine", nameAr: "الطب العام" },
    { name: "Pediatrics", nameAr: "طب الأطفال" },
    { name: "Dermatology", nameAr: "الأمراض الجلدية" },
    { name: "Physiotherapy", nameAr: "العلاج الطبيعي" },
    { name: "Cardiology", nameAr: "أمراض القلب" },
    { name: "Archive (inactive)", nameAr: "الأرشيف", isActive: false },
  ];
  const departments: Department[] = [];
  for (const d of deptDefs) {
    departments.push(
      await prisma.department.create({
        data: {
          clinicId: clinic.id,
          name: d.name,
          nameAr: d.nameAr,
          isActive: d.isActive ?? true,
        },
      }),
    );
  }

  const rooms: Room[] = [];
  let roomN = 1;
  for (const dept of departments.filter((d) => d.isActive)) {
    for (let i = 0; i < 2; i++) {
      rooms.push(
        await prisma.room.create({
          data: {
            clinicId: clinic.id,
            departmentId: dept.id,
            name: `Room ${roomN}`,
            nameAr: `غرفة ${roomN}`,
          },
        }),
      );
      roomN++;
    }
  }

  const serviceDefs: Array<{
    name: string;
    nameAr: string;
    dept: number;
    durationMins: number;
    fee: number;
    modes: ("in_person" | "online")[];
  }> = [
    {
      name: "General Consultation",
      nameAr: "استشارة عامة",
      dept: 0,
      durationMins: 30,
      fee: 25,
      modes: ["in_person", "online"],
    },
    {
      name: "Follow-up Visit",
      nameAr: "مراجعة",
      dept: 0,
      durationMins: 20,
      fee: 15,
      modes: ["in_person", "online"],
    },
    {
      name: "Child Checkup",
      nameAr: "فحص طفل",
      dept: 1,
      durationMins: 30,
      fee: 30,
      modes: ["in_person"],
    },
    {
      name: "Vaccination",
      nameAr: "تطعيم",
      dept: 1,
      durationMins: 15,
      fee: 20,
      modes: ["in_person"],
    },
    {
      name: "Skin Assessment",
      nameAr: "تقييم جلدي",
      dept: 2,
      durationMins: 40,
      fee: 40,
      modes: ["in_person", "online"],
    },
    {
      name: "Acne Treatment",
      nameAr: "علاج حب الشباب",
      dept: 2,
      durationMins: 45,
      fee: 55,
      modes: ["in_person"],
    },
    {
      name: "Physio Session",
      nameAr: "جلسة علاج طبيعي",
      dept: 3,
      durationMins: 45,
      fee: 35,
      modes: ["in_person"],
    },
    {
      name: "Rehab Package Visit",
      nameAr: "جلسة تأهيل",
      dept: 3,
      durationMins: 60,
      fee: 45,
      modes: ["in_person"],
    },
    {
      name: "ECG",
      nameAr: "تخطيط قلب",
      dept: 4,
      durationMins: 25,
      fee: 50,
      modes: ["in_person"],
    },
    {
      name: "Cardio Consult",
      nameAr: "استشارة قلب",
      dept: 4,
      durationMins: 40,
      fee: 60,
      modes: ["in_person", "online"],
    },
    {
      name: "Telehealth Quick",
      nameAr: "استشارة سريعة",
      dept: 0,
      durationMins: 15,
      fee: 12,
      modes: ["online"],
    },
    {
      name: "Full Physical",
      nameAr: "فحص شامل",
      dept: 0,
      durationMins: 60,
      fee: 70,
      modes: ["in_person"],
    },
  ];

  const services: Service[] = [];
  for (const s of serviceDefs) {
    services.push(
      await prisma.service.create({
        data: {
          clinicId: clinic.id,
          departmentId: departments[s.dept].id,
          name: s.name,
          nameAr: s.nameAr,
          durationMins: s.durationMins,
          fee: new Prisma.Decimal(s.fee),
          supportedModes: s.modes,
        },
      }),
    );
  }

  const activeDepartments = departments.filter((d) => d.isActive);
  for (let i = 0; i < doctors.length; i++) {
    const dept = pick(activeDepartments, i);
    const room = rooms.find((r) => r.departmentId === dept.id) ?? rooms[0];
    const credentialed = services
      .filter((s) => s.departmentId === dept.id)
      .slice(0, 3);
    const employment =
      doctors[i].employmentType ?? (i % 3 === 0 ? "commission" : "salaried");
    await prisma.clinicUser.update({
      where: { id: doctors[i].id },
      data: {
        title: doctors[i].title ?? "Dr",
        departmentId: dept.id,
        defaultRoomId: room?.id ?? null,
        employmentType: employment,
        commissionPercent:
          employment === "commission" || employment === "mixed"
            ? new Prisma.Decimal(25)
            : null,
        calendarColor:
          doctors[i].calendarColor ??
          pick(
            ["brand", "accent-teal", "primary", "success", "warning"] as const,
            i,
          ),
        bufferMins: doctors[i].bufferMins || 10,
      },
    });
    if (credentialed.length) {
      await prisma.clinicUserService.createMany({
        data: credentialed.map((s) => ({
          clinicUserId: doctors[i].id,
          serviceId: s.id,
        })),
        skipDuplicates: true,
      });
    }
  }

  const payMethods: PaymentMethod[] = [];
  const payNames = ["Cash", "Card", "Transfer", "Insurance", "Other"] as const;
  for (let i = 0; i < payNames.length; i++) {
    payMethods.push(
      await prisma.paymentMethod.create({
        data: { clinicId: clinic.id, name: payNames[i], sortOrder: i },
      }),
    );
  }

  const packages = await Promise.all([
    prisma.package.create({
      data: {
        clinicId: clinic.id,
        name: "10-Session Bundle",
        description: "Ten physio/general sessions",
        sessionCount: 10,
        price: new Prisma.Decimal(300),
        sortOrder: 0,
      },
    }),
    prisma.package.create({
      data: {
        clinicId: clinic.id,
        name: "5-Visit Cardio Pack",
        description: "Five cardiology visits",
        sessionCount: 5,
        price: new Prisma.Decimal(250),
        discountType: "percentage",
        discountValue: new Prisma.Decimal(10),
        sortOrder: 1,
      },
    }),
    prisma.package.create({
      data: {
        clinicId: clinic.id,
        name: "Prepaid Credit 100 JOD",
        description: "Credit wallet for any visit",
        sessionCount: null,
        price: new Prisma.Decimal(100),
        sortOrder: 2,
      },
    }),
    prisma.package.create({
      data: {
        clinicId: clinic.id,
        name: "Prepaid Credit 50 JOD",
        description: "Smaller credit pot",
        sessionCount: null,
        price: new Prisma.Decimal(50),
        sortOrder: 3,
      },
    }),
  ]);

  const now = new Date();
  const codes = await Promise.all([
    prisma.discountCode.create({
      data: {
        clinicId: clinic.id,
        code: "WELCOME10",
        discountType: "percentage",
        discountValue: new Prisma.Decimal(10),
        maxUses: 100,
        usedCount: 3,
        validFrom: daysFromNow(-30),
        validTo: daysFromNow(90),
      },
    }),
    prisma.discountCode.create({
      data: {
        clinicId: clinic.id,
        code: "FLAT5",
        discountType: "fixed",
        discountValue: new Prisma.Decimal(5),
        maxUses: 50,
        usedCount: 1,
        validFrom: daysFromNow(-10),
        validTo: daysFromNow(60),
      },
    }),
    prisma.discountCode.create({
      data: {
        clinicId: clinic.id,
        code: "SUMMER20",
        discountType: "percentage",
        discountValue: new Prisma.Decimal(20),
        maxUses: 20,
        usedCount: 0,
        validFrom: daysFromNow(-5),
        validTo: daysFromNow(30),
      },
    }),
    prisma.discountCode.create({
      data: {
        clinicId: clinic.id,
        code: "EXPIRED15",
        discountType: "percentage",
        discountValue: new Prisma.Decimal(15),
        validFrom: daysFromNow(-90),
        validTo: daysFromNow(-1),
        isActive: false,
      },
    }),
    prisma.discountCode.create({
      data: {
        clinicId: clinic.id,
        code: "MAXED",
        discountType: "fixed",
        discountValue: new Prisma.Decimal(8),
        maxUses: 2,
        usedCount: 2,
        validFrom: daysFromNow(-20),
        validTo: daysFromNow(20),
      },
    }),
    prisma.discountCode.create({
      data: {
        clinicId: clinic.id,
        code: "STAFF25",
        discountType: "percentage",
        discountValue: new Prisma.Decimal(25),
        validFrom: daysFromNow(-1),
        validTo: daysFromNow(365),
      },
    }),
  ]);

  const firstNames = [
    "Ahmad",
    "Layla",
    "Yousef",
    "Noor",
    "Khaled",
    "Maya",
    "Tariq",
    "Hala",
    "Rami",
    "Sara",
    "Fadi",
    "Dina",
    "Zaid",
    "Rana",
    "Samir",
    "Lina",
    "Hasan",
    "Farah",
    "Basel",
    "Nadia",
    "Omar",
    "Jana",
    "Walid",
    "Reem",
    "Issa",
    "Dana",
  ];
  const lastNames = [
    "Al-Masri",
    "Haddad",
    "Nasser",
    "Khoury",
    "Saleh",
    "Qasim",
    "Farouq",
    "Barakat",
    "Awad",
    "Hamdan",
    "Zoubi",
    "Taha",
    "Jaber",
    "Mansour",
  ];
  const genders = ["male", "female"];
  const bloods = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const patients: Patient[] = [];
  for (let i = 0; i < 52; i++) {
    const fn = pick(firstNames, i);
    const ln = pick(lastNames, i * 3);
    const doctor = pick(doctors, i);
    const usePkg = i % 3 === 0;
    const useCode = i % 5 === 0;
    const pkg = usePkg ? pick(packages, i) : null;
    patients.push(
      await prisma.patient.create({
        data: {
          clinicId: clinic.id,
          firstNameEn: fn,
          lastNameEn: ln,
          firstNameAr: fn,
          lastNameAr: ln,
          nationalId: `99${String(100000000 + i).slice(0, 9)}`,
          phone: `+96279${String(2000000 + i).padStart(7, "0")}`,
          email: `${fn.toLowerCase()}.${ln.toLowerCase().replace(/[^a-z]/g, "")}${i}@demo.local`,
          dob: new Date(1980 + (i % 30), i % 12, (i % 27) + 1),
          gender: pick(genders, i),
          bloodType: pick(bloods, i),
          allergies: i % 4 === 0 ? "Penicillin" : i % 7 === 0 ? "Dust" : null,
          emergencyContactName: `EC ${fn}`,
          emergencyContactPhone: `+96278${String(3000000 + i).padStart(7, "0")}`,
          address: `Amman — Street ${(i % 40) + 1}, Building ${(i % 12) + 1}`,
          primaryDoctorId: doctor.id,
          packageId: pkg?.id ?? null,
          discountCodeId: useCode ? pick(codes, i).id : null,
          isActive: i !== 50,
        },
      }),
    );
  }

  // Enrollments for patients with catalog packages + some extras
  const enrollments: PatientPackage[] = [];
  for (let i = 0; i < patients.length; i++) {
    if (i % 3 !== 0) continue;
    const patient = patients[i];
    const pkg = packages[i % packages.length];
    const isSession = pkg.sessionCount != null;
    enrollments.push(
      await prisma.patientPackage.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          packageId: pkg.id,
          sessionsTotal: isSession ? pkg.sessionCount : null,
          creditTotal: isSession ? null : pkg.price,
          notes: "Demo enrollment",
        },
      }),
    );
  }

  const statuses: AppointmentStatus[] = [
    "unconfirmed",
    "confirmed",
    "checked_in",
    "waiting",
    "in_progress",
    "completed",
    "no_show",
    "cancelled",
  ];

  let apptCount = 0;
  const appointments: Appointment[] = [];

  for (let day = -7; day <= 14; day++) {
    const perDay = day === 0 ? 18 : day > 0 ? 8 : 10;
    for (let slot = 0; slot < perDay; slot++) {
      const patient = pick(patients, apptCount);
      const doctor = pick(doctors, apptCount + slot);
      const service = pick(services, apptCount);
      const deptId = service.departmentId ?? departments[0].id;
      const roomCandidates = rooms.filter((r) => r.departmentId === deptId);
      const online =
        service.supportedModes.includes("online") && slot % 5 === 0;
      const hour = 8 + (slot % 10);
      const minute = slot % 2 === 0 ? 0 : 30;
      const scheduledAt = daysFromNow(day, hour, minute);
      const status = pick(statuses, apptCount + day + 3);
      const isTerminalMiss = status === "cancelled" || status === "no_show";
      const enrollment =
        enrollments.find((e) => e.patientId === patient.id) ?? null;

      const fee = Number(service.fee);
      let discount: number | null = null;
      let discountType: "fixed" | "percentage" | null = null;
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
        discountCodeId = codes[1].id;
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
          scheduledAt.getTime() + (15 + (apptCount % 40)) * 60_000,
        );
        waitingMins = Math.max(
          0,
          Math.floor(
            (inProgressAt.getTime() - waitingStartedAt.getTime()) / 60_000,
          ),
        );
      }

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

      const isSessionEnrollment = activeEnrollment?.sessionsTotal != null;

      appointments.push(
        await prisma.appointment.create({
          data: {
            clinicId: clinic.id,
            patientId: patient.id,
            doctorId: doctor.id,
            departmentId: deptId,
            roomId: online
              ? null
              : pick(roomCandidates.length ? roomCandidates : rooms, slot).id,
            serviceId: service.id,
            scheduledAt,
            durationMins: service.durationMins,
            sessionType: online ? "online" : "in_person",
            meetingUrl: online ? "https://meet.example.com/demo-room" : null,
            status,
            statusUpdatedAt: now,
            statusUpdatedBy: doctor.userId,
            waitingStartedAt,
            inProgressAt,
            waitingMins,
            cancelReason:
              status === "cancelled" ? "Patient requested reschedule" : null,
            notes: apptCount % 7 === 0 ? "Demo clinical note" : null,
            fee: new Prisma.Decimal(fee),
            discount: discount != null ? new Prisma.Decimal(discount) : null,
            discountType,
            discountReason,
            discountCodeId,
            isPaid: recordPayment,
            paidAt: recordPayment ? (inProgressAt ?? now) : null,
            paidById: recordPayment ? payer.id : null,
            paymentMethodId:
              recordPayment && !usePackage
                ? pick(payMethods, apptCount).id
                : null,
            paymentMethod: activeEnrollment
              ? `Package: ${packages.find((p) => p.id === activeEnrollment.packageId)?.name ?? "Demo"}`
              : null,
            patientPackageId: activeEnrollment?.id ?? null,
            packageCredit:
              activeEnrollment && !isSessionEnrollment
                ? new Prisma.Decimal(payable)
                : null,
          },
        }),
      );
      apptCount++;
    }
  }

  // Referrals
  let referralCount = 0;
  for (let i = 0; i < 18; i++) {
    const appt = appointments[i * 7];
    if (!appt) continue;
    const from = pick(doctors, i);
    const to = pick(doctors, i + 1);
    if (from.id === to.id) continue;
    await prisma.referral.create({
      data: {
        clinicId: clinic.id,
        appointmentId: appt.id,
        fromDoctorId: from.id,
        toDoctorId: to.id,
        type: i % 2 === 0 ? "referral" : "consultation",
        urgency: pick(["normal", "high", "urgent"] as const, i),
        reason: "Demo referral for specialist review",
        opinion: i % 3 === 0 ? "Agree with plan" : null,
        status: pick(["pending", "accepted", "rejected"] as const, i),
      },
    });
    referralCount++;
  }

  // Availability + time off
  for (const doc of doctors) {
    for (const dayOfWeek of [0, 1, 2, 3, 4]) {
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doc.id,
          dayOfWeek,
          startTime: "08:00",
          endTime: "17:00",
          isActive: true,
        },
      });
    }
    await prisma.doctorTimeOff.create({
      data: {
        doctorId: doc.id,
        startDate: daysFromNow(20, 0, 0),
        endDate: daysFromNow(21, 23, 59),
        reason: "Conference",
      },
    });
  }

  // Notifications
  let notifCount = 0;
  for (const user of staff.slice(0, 4)) {
    for (let i = 0; i < 6; i++) {
      await prisma.notification.create({
        data: {
          clinicId: clinic.id,
          userId: user.id,
          type: pick(["appointment", "referral", "system"] as const, i),
          title: pick(
            [
              "New appointment booked",
              "Referral awaiting response",
              "Patient checked in",
              "Package almost empty",
            ],
            i + notifCount,
          ),
          body: "Demo notification for UI coverage",
          readAt: i % 2 === 0 ? now : null,
        },
      });
      notifCount++;
    }
  }

  console.log("--- Seed complete ---");
  console.log(`Departments: ${departments.length}`);
  console.log(`Rooms: ${rooms.length}`);
  console.log(`Services: ${services.length}`);
  console.log(`Payment methods: ${payMethods.length}`);
  console.log(`Packages: ${packages.length}`);
  console.log(`Promocodes: ${codes.length}`);
  console.log(`Patients: ${patients.length}`);
  console.log(`Enrollments: ${enrollments.length}`);
  console.log(`Appointments: ${appointments.length}`);
  console.log(`Referrals: ${referralCount}`);
  console.log(`Notifications: ${notifCount}`);
  console.log(`Demo staff password (if created): ${DEMO_PASSWORD}`);
  console.log(
    "Emails: dr.sara.demo@clinic.local, dr.omar.demo@clinic.local, finance.demo@clinic.local",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
