import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { AuthUser } from "@/modules/auth/types";
import { PrismaService } from "@/prisma/prisma.service";
import { visitError } from "./visit-errors";
export const visitInclude = {
  note: true,
  report: true,
  invoice: { include: { payments: true } },
  documents: {
    select: {
      id: true,
      kind: true,
      revision: true,
      signedAt: true,
      releasedAt: true,
    },
  },
  events: {
    where: {
      kind: {
        in: ["note_addendum", "invoice_feedback", "invoice_feedback_resolved"],
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.VisitInclude;
export const workspaceInclude = {
  patient: true,
  doctor: true,
  clinic: true,
  room: true,
  service: true,
  visit: { include: visitInclude },
} satisfies Prisma.AppointmentInclude;
export const summaryInclude = {
  patient: {
    select: {
      firstNameEn: true,
      lastNameEn: true,
      firstNameAr: true,
      lastNameAr: true,
    },
  },
  doctor: { select: { name: true, nameAr: true } },
  visit: {
    select: {
      id: true,
      startedAt: true,
      finishedAt: true,
      documentationDeadlineAt: true,
      unlockGrantedAt: true,
      noteStatus: true,
      reportStatus: true,
      invoiceStatus: true,
      note: { select: { signedAt: true } },
    },
  },
} satisfies Prisma.AppointmentInclude;
export type SummaryRow = Prisma.AppointmentGetPayload<{
  include: typeof summaryInclude;
}>;
export type WorkspaceRow = Prisma.AppointmentGetPayload<{
  include: typeof workspaceInclude;
}>;
export type VisitRow = NonNullable<WorkspaceRow["visit"]>;
export type VisitTx = Prisma.TransactionClient;
@Injectable()
export class VisitsRepository {
  constructor(readonly db: PrismaService) {}
  async transaction<T>(fn: (tx: VisitTx) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.db.$transaction(fn, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 20000,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034" &&
          attempt < 2
        )
          continue;
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034"
        )
          visitError("visitRevisionConflict", 409);
        throw error;
      }
    }
  }
  async appointment(
    tx: VisitTx,
    actor: AuthUser,
    id: string,
  ): Promise<WorkspaceRow> {
    const row = await tx.appointment.findFirst({
      where: {
        id,
        clinicId: actor.clinicId,
        ...(actor.role === "practitioner" && { doctorId: actor.clinicUserId }),
      },
      include: workspaceInclude,
    });
    if (
      !row ||
      row.patient.clinicId !== actor.clinicId ||
      row.doctor.clinicId !== actor.clinicId ||
      (row.room && row.room.clinicId !== actor.clinicId) ||
      (row.service && row.service.clinicId !== actor.clinicId)
    )
      visitError("visitNotFound", 404);
    return row;
  }
  async withAppointment<T>(
    actor: AuthUser,
    id: string,
    fn: (tx: VisitTx, row: WorkspaceRow) => Promise<T>,
  ): Promise<T> {
    return this.transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${actor.clinicId}, 0))`;
      await tx.$queryRaw`SELECT "id" FROM "Appointment" WHERE "id" = ${id} AND "clinicId" = ${actor.clinicId} FOR UPDATE`;
      return fn(tx, await this.appointment(tx, actor, id));
    });
  }
  async withVisit<T>(
    actor: AuthUser,
    id: string,
    fn: (tx: VisitTx, row: WorkspaceRow, visit: VisitRow) => Promise<T>,
  ): Promise<T> {
    const visit = await this.db.visit.findFirst({
      where: { id, clinicId: actor.clinicId },
      select: { appointmentId: true },
    });
    if (!visit) visitError("visitNotFound", 404);
    return this.withAppointment(actor, visit.appointmentId, (tx, row) => {
      if (!row.visit || row.visit.id !== id) visitError("visitNotFound", 404);
      return fn(tx, row, row.visit);
    });
  }
}
