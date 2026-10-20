import "dotenv/config";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import { PrismaClient, Prisma, type AppointmentStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import type { ClinicalTemplateInput, ClinicalValue } from "@clinic/types";

const { values: args } = parseArgs({
  options: {
    email: { type: "string" },
    clinic: { type: "string" },
    host: { type: "string" },
    apply: { type: "boolean", default: false },
  },
});
if (process.env.NODE_ENV === "production")
  throw new Error("Demo data is development-only.");
if (!args.email?.endsWith("@clinic.local") || !args.clinic || !args.host)
  throw new Error(
    "Provide --email <demo@clinic.local> --clinic <id> --host <confirmed host> [--apply].",
  );
const target = new URL(process.env.DATABASE_URL ?? "");
if (target.hostname !== args.host)
  throw new Error("Database host does not match the confirmed target.");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    target.hostname === "localhost" ? undefined : { rejectUnauthorized: false },
});
const db = new PrismaClient({
  adapter: new PrismaPg(pool, { disposeExternalPool: true }),
});
const json = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const names = [
  ["Layan", "ليان"],
  ["Maya", "مايا"],
  ["Sara", "سارة"],
  ["Noor", "نور"],
  ["Hala", "هالة"],
  ["Rania", "رانيا"],
  ["Lina", "لينا"],
  ["Salma", "سلمى"],
  ["Reem", "ريم"],
  ["Dana", "دانا"],
  ["Yara", "يارا"],
  ["Razan", "رزان"],
];
const avatars = [1, 2, 3, 5, 7, 8, 11, 12, 13, 14, 16, 17];

async function main() {
  const doctor = await db.clinicUser.findFirstOrThrow({
    where: {
      clinicId: args.clinic,
      user: { email: args.email },
      role: "practitioner",
      isActive: true,
    },
    include: {
      clinic: true,
      availabilities: true,
      timeOffs: true,
      services: { include: { service: true } },
    },
  });
  const id = (key: string) => {
    const h = createHash("sha256")
      .update(`cureva-practitioner-demo-v1:${doctor.id}:${key}`)
      .digest("hex");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
  };
  const marker = "Cureva practitioner demo v1";
  const existing = await db.appointment.count({
    where: {
      clinicId: doctor.clinicId,
      doctorId: doctor.id,
      notes: { startsWith: marker },
    },
  });
  if (existing) {
    console.log(
      JSON.stringify({
        alreadyPrepared: true,
        appointments: existing,
        changed: 0,
      }),
    );
    return;
  }
  const now = new Date();
  const clock = new Intl.DateTimeFormat("en-CA", {
    timeZone: doctor.clinic.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = (date: Date) =>
    Object.fromEntries(
      clock.formatToParts(date).map((part) => [part.type, Number(part.value)]),
    );
  const today = parts(now);
  const at = (day: number, hour: number, minute = 0) => {
    const proposed = Date.UTC(
      today.year,
      today.month - 1,
      today.day + day,
      hour,
      minute,
    );
    const p = parts(new Date(proposed));
    return new Date(
      proposed -
        (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - proposed),
    );
  };
  const weekday = (day: number) =>
    new Date(
      Date.UTC(today.year, today.month - 1, today.day + day),
    ).getUTCDay();
  const missingDays = [0, 1, 2, 3, 4].filter(
    (day) =>
      !doctor.availabilities.some(
        (row) => row.dayOfWeek === day && row.isActive,
      ),
  );
  const hours = [
    ...doctor.availabilities,
    ...missingDays.map((dayOfWeek) => ({
      dayOfWeek,
      startTime: "09:00",
      endTime: "17:00",
      isActive: true,
      effectiveFrom: null,
      effectiveUntil: null,
    })),
  ];
  const busyWhere: Prisma.AppointmentWhereInput = {
    clinicId: doctor.clinicId,
    OR: [
      { doctorId: doctor.id },
      ...(doctor.defaultRoomId ? [{ roomId: doctor.defaultRoomId }] : []),
    ],
    scheduledAt: { gte: at(-28, 0), lt: at(29, 0) },
    status: { notIn: ["cancelled", "no_show"] },
    AND: [
      {
        OR: [
          { doctorId: { not: doctor.id } },
          { notes: null },
          { NOT: { notes: { startsWith: marker } } },
        ],
      },
    ],
  };
  const busy = await db.appointment.findMany({
    where: busyWhere,
    select: { scheduledAt: true, durationMins: true },
  });
  const overlaps = (
    start: Date,
    row: { scheduledAt: Date; durationMins: number },
  ) =>
    start.getTime() <
      row.scheduledAt.getTime() +
        (row.durationMins + doctor.bufferMins) * 60_000 &&
    start.getTime() + (30 + doctor.bufferMins) * 60_000 >
      row.scheduledAt.getTime();
  const minuteOf = (value: string) =>
    Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  const slots = (day: number) => {
    const result: Date[] = [];
    for (const shift of hours.filter(
      (row) => row.isActive && row.dayOfWeek === weekday(day),
    )) {
      if (
        (shift.effectiveFrom && at(day, 12) < shift.effectiveFrom) ||
        (shift.effectiveUntil && at(day, 0) > shift.effectiveUntil)
      )
        continue;
      for (
        let minute = minuteOf(shift.startTime);
        minute + 30 <= minuteOf(shift.endTime);
        minute += Math.max(45, 30 + doctor.bufferMins)
      ) {
        const start = at(day, Math.floor(minute / 60), minute % 60);
        if (
          doctor.timeOffs.some(
            (off) =>
              start < off.endDate &&
              start.getTime() + 30 * 60_000 > off.startDate.getTime(),
          )
        )
          continue;
        if (busy.some((row) => overlaps(start, row))) continue;
        if (!result.some((item) => item.getTime() === start.getTime()))
          result.push(start);
      }
    }
    return result.sort((a, b) => a.getTime() - b.getTime());
  };
  const past = Array.from({ length: 21 }, (_, i) => -21 + i)
    .flatMap((day) => slots(day).slice(0, 2))
    .slice(-18);
  const daySlots = slots(0);
  const pastToday = daySlots
    .filter((start) => start.getTime() + 30 * 60_000 < now.getTime())
    .slice(-4);
  const laterToday = daySlots.filter((start) => start >= now).slice(0, 6);
  const current = daySlots.find(
    (start) => start <= now && start.getTime() + 30 * 60_000 > now.getTime(),
  );
  const future = Array.from({ length: 21 }, (_, i) => i + 1)
    .flatMap((day) => slots(day).slice(0, 2))
    .slice(0, 18);
  const scenarios: { at: Date; status: AppointmentStatus }[] = [
    ...past.map((date, i) => ({
      at: date,
      status: (i % 6 === 4
        ? "cancelled"
        : i % 6 === 5
          ? "no_show"
          : "completed") as AppointmentStatus,
    })),
    ...pastToday.map((date, i) => ({
      at: date,
      status: (i < 2
        ? "completed"
        : i === 2
          ? "waiting"
          : "checked_in") as AppointmentStatus,
    })),
    ...(current ? [{ at: current, status: "in_progress" as const }] : []),
    ...laterToday.map((date, i) => ({
      at: date,
      status: (i % 2 ? "unconfirmed" : "confirmed") as AppointmentStatus,
    })),
    ...future.map((date, i) => ({
      at: date,
      status: (i % 3 ? "confirmed" : "unconfirmed") as AppointmentStatus,
    })),
  ];
  const service = doctor.services
    .map((item) => item.service)
    .find((item) => item.isActive);
  if (!service)
    throw new Error("Assign an active service before preparing demo data.");
  const candidates = await db.clinicalNoteTemplate.findMany({
    where: {
      clinicId: doctor.clinicId,
      status: { not: "archived" },
      publishedAt: { not: null },
    },
    orderBy: { createdAt: "asc" },
  });
  const template = candidates.find((item) => {
    const snapshot = item.published as unknown as
      ClinicalTemplateInput | undefined;
    return (
      snapshot &&
      (snapshot.availableToAll ||
        snapshot.assignments.practitionerIds.includes(doctor.id) ||
        snapshot.assignments.departmentIds.includes(
          doctor.departmentId ?? "",
        ) ||
        snapshot.assignments.serviceIds.includes(service.id))
    );
  });
  if (!template?.published)
    throw new Error(
      "Publish an available template before preparing clinical demo records.",
    );
  const sections = (template.published as unknown as ClinicalTemplateInput)
    .sections;
  const sampleValues: Record<string, ClinicalValue> = {};
  for (const field of sections.flatMap((section) => section.fields)) {
    if (field.visibility) continue;
    const number = Math.max(field.min ?? 0, Math.min(field.max ?? 120, 80));
    if (["text", "textarea"].includes(field.type))
      sampleValues[field.id] =
        "DEMO ONLY - fictional consultation for interface preview. بيانات تجريبية فقط.";
    else if (field.type === "boolean") sampleValues[field.id] = false;
    else if (field.type === "scale") sampleValues[field.id] = 3;
    else if (field.type === "time") sampleValues[field.id] = "09:30";
    else if (field.type === "medications")
      sampleValues[field.id] = [{ drug: "DEMO Paracetamol", dose: "500 mg", frequency: "Twice daily" }];
    else if (field.type === "number") sampleValues[field.id] = number;
    else if (field.type === "measurement")
      sampleValues[field.id] = { value: number, unit: field.unit ?? "" };
    else if (field.type === "date")
      sampleValues[field.id] =
        `${today.year}-${String(today.month).padStart(2, "0")}-${String(today.day).padStart(2, "0")}`;
    else if (field.options?.length)
      sampleValues[field.id] = ["multi_select", "checkboxes"].includes(
        field.type,
      )
        ? [field.options[0].value]
        : field.options[0].value;
  }
  const patients: Prisma.PatientCreateManyInput[] = names.map(
    ([name, ar], i) => ({
      id: id(`patient:${i}`),
      clinicId: doctor.clinicId,
      primaryDoctorId: doctor.id,
      firstNameEn: name,
      lastNameEn: "Demo",
      firstNameAr: ar,
      lastNameAr: "تجريبي",
      email: `cureva.abeer.demo.${i + 1}@example.invalid`,
      phone: `+120255501${String(i).padStart(2, "0")}`,
      dob: new Date(Date.UTC(1965 + i * 3, i % 12, 12)),
      gender: "female",
      imageUrl: `/avatars/avatar-${avatars[i]}-v2.webp`,
      bloodType: ["A+", "B+", "O+", "AB+"][i % 4],
      allergies: i % 3 === 0 ? "DEMO: Penicillin" : null,
      address: "Demo address - Amman / عنوان تجريبي - عمّان",
    }),
  );
  const appointments: Prisma.AppointmentCreateManyInput[] = scenarios.map(
    (scenario, i) => {
      const present = [
        "in_progress",
        "completed",
        "waiting",
        "checked_in",
      ].includes(scenario.status);
      const online = i % 5 === 0;
      return {
        id: id(`appointment:${i}`),
        clinicId: doctor.clinicId,
        doctorId: doctor.id,
        patientId: patients[i % patients.length]!.id!,
        departmentId: doctor.departmentId,
        roomId: online ? null : doctor.defaultRoomId,
        serviceId: service.id,
        scheduledAt: scenario.at,
        durationMins: 30,
        sessionType: online ? "online" : "in_person",
        status: scenario.status,
        notes: `${marker} - fictional development data / بيانات تجريبية`,
        fee: service.fee,
        presenceConfirmedAt: present
          ? new Date(scenario.at.getTime() - 5 * 60_000)
          : null,
        presenceConfirmedById: present ? doctor.userId : null,
        presenceSource: present
          ? online
            ? "online_manual"
            : "practitioner"
          : null,
        waitingStartedAt: ["waiting", "checked_in"].includes(scenario.status)
          ? scenario.at
          : null,
        inProgressAt: ["completed", "in_progress"].includes(scenario.status)
          ? scenario.at
          : null,
        waitingMins: present ? 5 : null,
        statusUpdatedAt: scenario.at,
        statusUpdatedBy: doctor.userId,
        cancelReason:
          scenario.status === "cancelled"
            ? "Demo cancellation / إلغاء تجريبي"
            : null,
      };
    },
  );
  const visits: Prisma.VisitCreateManyInput[] = appointments
    .filter((item) => ["completed", "in_progress"].includes(item.status!))
    .map((item) => {
      const end = new Date(new Date(item.scheduledAt).getTime() + 30 * 60_000);
      return {
        id: id(`visit:${item.id}`),
        clinicId: doctor.clinicId,
        appointmentId: item.id!,
        startedAt: item.scheduledAt,
        finishedAt: item.status === "completed" ? end : null,
        scheduledEndAt: end,
        documentationDeadlineAt: new Date(end.getTime() + 48 * 3600_000),
        noteStatus: "draft",
        invoiceStatus:
          item.status === "completed" ? "awaiting_review" : "preparing",
        context: json({
          demo: true,
          patientName: `${patients.find((patient) => patient.id === item.patientId)!.firstNameEn} Demo`,
          practitionerName: doctor.name,
          practitionerNameAr: doctor.nameAr,
          clinicName: doctor.clinic.name,
          clinicNameAr: doctor.clinic.nameAr,
          timezone: doctor.clinic.timezone,
          mode: item.sessionType,
          scheduledAt: new Date(item.scheduledAt).toISOString(),
          durationMins: 30,
          fee: service.fee.toString(),
          discount: "0",
          discountType: null,
          packageCoverage: "0",
          prepaid: false,
          paymentMethodId: null,
          serviceName: service.name,
        }),
      };
    });
  console.log(
    JSON.stringify({
      mode: args.apply ? "apply" : "preview",
      database: target.hostname,
      practitioner: args.email,
      patients: patients.length,
      appointments: appointments.length,
      visits: visits.length,
      missingWorkingDays: missingDays.length,
      statusCounts: scenarios.reduce<Record<string, number>>(
        (counts, row) => ({
          ...counts,
          [row.status]: (counts[row.status] ?? 0) + 1,
        }),
        {},
      ),
    }),
  );
  if (!args.apply) return;
  const created = await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${doctor.clinicId}, 0))`;
      const recheck = await tx.appointment.findMany({
        where: busyWhere,
        select: { scheduledAt: true, durationMins: true },
      });
      if (
        appointments.some((item) =>
          recheck.some((row) => overlaps(new Date(item.scheduledAt), row)),
        )
      )
        throw new Error(
          "A booking changed while preparing data. Retry the preview.",
        );
      const p = await tx.patient.createMany({
        data: patients,
        skipDuplicates: true,
      });
      const a = await tx.appointment.createMany({
        data: appointments,
        skipDuplicates: true,
      });
      const v = await tx.visit.createMany({
        data: visits,
        skipDuplicates: true,
      });
      const n = await tx.clinicalNote.createMany({
        data: visits.map((visit) => ({
          id: id(`note:${visit.id}`),
          clinicId: doctor.clinicId,
          visitId: visit.id!,
          templateId: template.id,
          sectionsSnapshot: json(sections),
          values: json(sampleValues),
          authorId: doctor.id,
          savedAt: visit.finishedAt ?? now,
        })),
        skipDuplicates: true,
      });
      const invoices = await tx.visitInvoice.createMany({
        data: visits
          .filter((visit) => visit.finishedAt)
          .map((visit) => ({
            id: id(`invoice:${visit.id}`),
            clinicId: doctor.clinicId,
            visitId: visit.id!,
            currency: "JOD",
            subtotal: service.fee,
            total: service.fee,
            lineItems: json([
              {
                id: "consultation",
                description: `${service.name} (demo)`,
                quantity: "1",
                unitPrice: service.fee.toFixed(3),
                total: service.fee.toFixed(3),
              },
            ]),
          })),
        skipDuplicates: true,
      });
      await tx.visitEvent.createMany({
        data: visits.flatMap((visit) => [
          {
            id: id(`started:${visit.id}`),
            clinicId: doctor.clinicId,
            visitId: visit.id!,
            actorId: doctor.id,
            kind: "visit_started",
            createdAt: visit.startedAt,
            reason: marker,
          },
          ...(visit.finishedAt
            ? [
                {
                  id: id(`finished:${visit.id}`),
                  clinicId: doctor.clinicId,
                  visitId: visit.id!,
                  actorId: doctor.id,
                  kind: "visit_finished",
                  createdAt: visit.finishedAt,
                  reason: marker,
                },
              ]
            : []),
        ]),
        skipDuplicates: true,
      });
      await tx.doctorAvailability.createMany({
        data: missingDays.map((day) => ({
          id: id(`hours:${day}`),
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
        })),
        skipDuplicates: true,
      });
      await tx.doctorAvailabilityOverride.createMany({
        data: [3, 10, 17].map((day, i) => ({
          id: id(`extra:${i}`),
          doctorId: doctor.id,
          startAt: at(day, 18),
          endAt: at(day, 20),
          reason: `${marker}: evening clinic / عيادة مسائية تجريبية`,
        })),
        skipDuplicates: true,
      });
      await tx.doctorTimeOff.createMany({
        data: [
          {
            id: id("leave"),
            doctorId: doctor.id,
            startDate: at(24, 0),
            endDate: at(25, 0),
            reason: `${marker}: study leave / إجازة تدريب تجريبية`,
          },
        ],
        skipDuplicates: true,
      });
      await tx.clinicUser.update({
        where: { id: doctor.id },
        data: {
          ...(doctor.defaultNoteTemplateId
            ? {}
            : { defaultNoteTemplateId: template.id }),
          ...(doctor.licenseNumber ? {} : { licenseNumber: "DEMO-AB-001" }),
          ...(doctor.licenseExpiry ? {} : { licenseExpiry: at(365, 0) }),
          ...(doctor.employmentType ? {} : { employmentType: "salaried" }),
          ...(doctor.languages.length
            ? {}
            : { languages: ["Arabic", "English"] }),
        },
      });
      return {
        patients: p.count,
        appointments: a.count,
        visits: v.count,
        notes: n.count,
        invoices: invoices.count,
      };
    },
    { timeout: 60_000 },
  );
  console.log(JSON.stringify({ created, scopedToSinglePractitioner: true }));
}
main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Demo preparation failed.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
