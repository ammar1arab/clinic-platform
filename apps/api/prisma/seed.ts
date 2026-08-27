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
  type ClinicUser,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcrypt";
import {
  CLINIC_DEPARTMENTS,
  CLINIC_SERVICES,
  buildJordanianPractitioners,
  type SeedPractitioner,
} from "./jordan-practitioners";

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
  const item = arr[((i % arr.length) + arr.length) % arr.length];
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

  await prisma.clinicUser.updateMany({
    where: { clinicId },
    data: { departmentId: null, defaultRoomId: null },
  });

  await prisma.discountCode.deleteMany({ where: { clinicId } });
  await prisma.package.deleteMany({ where: { clinicId } });
  await prisma.paymentMethod.deleteMany({ where: { clinicId } });
  await prisma.service.deleteMany({ where: { clinicId } });
  await prisma.room.deleteMany({ where: { clinicId } });
  await prisma.department.deleteMany({ where: { clinicId } });
}

async function upsertClinicUserByEmail(
  clinicId: string,
  email: string,
  passwordHash: string,
  profile: Omit<Prisma.ClinicUserUncheckedCreateInput, "userId" | "clinicId">,
) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, passwordHash, mustChangePassword: false },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    });
  }

  const existing = await prisma.clinicUser.findFirst({
    where: { userId: user.id, clinicId },
  });
  if (existing) {
    return prisma.clinicUser.update({
      where: { id: existing.id },
      data: profile,
    });
  }
  return prisma.clinicUser.create({
    data: { ...profile, userId: user.id, clinicId },
  });
}

function practitionerWriteData(
  seed: SeedPractitioner,
): Omit<Prisma.ClinicUserUncheckedCreateInput, "userId" | "clinicId"> {
  return {
    role: "practitioner",
    name: seed.name,
    nameAr: seed.nameAr,
    title: seed.title,
    phone: seed.phone,
    whatsapp: seed.whatsapp,
    nationality: seed.nationality,
    specialty: seed.specialty,
    specialtyAr: seed.specialtyAr,
    languages: seed.languages,
    initials: seed.initials,
    dob: seed.dob,
    gender: seed.gender,
    bio: seed.bio,
    bioAr: seed.bioAr,
    experienceYears: seed.experienceYears,
    imageUrl: seed.imageUrl,
    licenseNumber: seed.licenseNumber,
    licenseExpiry: seed.licenseExpiry,
    employmentType: seed.employmentType,
    commissionPercent:
      seed.commissionPercent == null
        ? null
        : new Prisma.Decimal(seed.commissionPercent),
    bufferMins: seed.bufferMins,
    isActive: true,
  };
}

async function ensureJordanianStaff(clinicId: string) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const roster = buildJordanianPractitioners();
  const practitioners: ClinicUser[] = [];
  for (const seed of roster) {
    practitioners.push(
      await upsertClinicUserByEmail(
        clinicId,
        seed.email,
        passwordHash,
        practitionerWriteData(seed),
      ),
    );
  }

  const finance = await upsertClinicUserByEmail(
    clinicId,
    "finance.demo@clinic.local",
    passwordHash,
    {
      role: "financial",
      name: "Lina Al-Qudah",
      nameAr: "لينا القضاه",
      title: "Finance",
      phone: "+962795551234",
      whatsapp: "+962795551234",
      nationality: "JO",
      languages: ["ar", "en"],
      initials: "LQ",
      gender: "female",
      dob: new Date(Date.UTC(1989, 4, 16)),
      isActive: true,
    },
  );

  const staff = await prisma.clinicUser.findMany({
    where: { clinicId, isActive: true },
  });
  return { practitioners, finance, staff, roster };
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

  const { practitioners, finance, staff, roster } = await ensureJordanianStaff(
    clinic.id,
  );
  const doctors = practitioners;
  const payer = finance ?? staff[0];
  const rosterByEmail = new Map(
    roster.map((seed) => [seed.email, seed] as const),
  );
  console.log(`Staff ready: ${staff.length} (doctors: ${doctors.length})`);

  const departments: Department[] = [];
  for (const d of CLINIC_DEPARTMENTS) {
    departments.push(
      await prisma.department.create({
        data: {
          clinicId: clinic.id,
          name: d.name,
          nameAr: d.nameAr,
          isActive: d.isActive === true,
        },
      }),
    );
  }
  const deptByName = new Map(departments.map((d) => [d.name, d]));

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

  const services: Service[] = [];
  for (const s of CLINIC_SERVICES) {
    const dept = deptByName.get(s.deptName);
    if (!dept) {
      throw new Error(`Missing department for service: ${s.deptName}`);
    }
    services.push(
      await prisma.service.create({
        data: {
          clinicId: clinic.id,
          departmentId: dept.id,
          name: s.name,
          nameAr: s.nameAr,
          durationMins: s.durationMins,
          fee: new Prisma.Decimal(s.fee),
          supportedModes: s.modes,
        },
      }),
    );
  }

  const doctorUsers = await prisma.clinicUser.findMany({
    where: { id: { in: doctors.map((d) => d.id) } },
    include: { user: { select: { email: true } } },
  });
  const roomCursor = new Map<string, number>();
  const doctorsByDept = new Map<string, typeof doctorUsers>();
  for (const doctor of doctorUsers) {
    const seed = rosterByEmail.get(doctor.user.email);
    const dept =
      (seed ? deptByName.get(seed.departmentName) : undefined) ??
      departments.find((d) => d.isActive);
    if (!dept) throw new Error("No active department to assign");
    const deptRooms = rooms.filter((r) => r.departmentId === dept.id);
    const cursor = roomCursor.get(dept.id) ?? 0;
    const room = deptRooms[cursor % Math.max(deptRooms.length, 1)] ?? rooms[0];
    roomCursor.set(dept.id, cursor + 1);
    const credentialed = services.filter((s) => s.departmentId === dept.id);
    await prisma.clinicUser.update({
      where: { id: doctor.id },
      data: {
        departmentId: dept.id,
        defaultRoomId: room?.id ?? null,
      },
    });
    if (credentialed.length) {
      await prisma.clinicUserService.createMany({
        data: credentialed.map((s) => ({
          clinicUserId: doctor.id,
          serviceId: s.id,
        })),
        skipDuplicates: true,
      });
    }
    const inDept = doctorsByDept.get(dept.id) ?? [];
    inDept.push(doctor);
    doctorsByDept.set(dept.id, inDept);
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
      const service = pick(services, apptCount);
      const deptId =
        service.departmentId ?? departments.find((d) => d.isActive)?.id;
      if (!deptId) throw new Error("No department for appointment");
      const deptDoctors = doctorsByDept.get(deptId);
      const doctor = pick(
        deptDoctors?.length ? deptDoctors : doctors,
        apptCount + slot,
      );
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

  for (const doctor of doctorUsers) {
    const seed = rosterByEmail.get(doctor.user.email);
    const slots = seed?.availabilities ?? [
      { dayOfWeek: 0, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
    ];
    for (const slot of slots) {
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isActive: true,
        },
      });
    }
    const offs = seed?.timeOffs ?? [];
    for (const off of offs) {
      await prisma.doctorTimeOff.create({
        data: {
          doctorId: doctor.id,
          startDate: daysFromNow(off.startOffset, 0, 0),
          endDate: daysFromNow(off.endOffset, 23, 59),
          reason: off.reason,
        },
      });
    }
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
  console.log(`Practitioners: ${doctors.length}`);
  console.log(`Demo staff password: ${DEMO_PASSWORD}`);
  console.log(
    "Login any seeded doctor at <firstname>.<lastname>@clinic.local (example: ahmad.alkhatib@clinic.local) or finance.demo@clinic.local",
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
