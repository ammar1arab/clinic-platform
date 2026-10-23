import { HttpException, Injectable } from "@nestjs/common";
import { Prisma, type ClinicalNoteTemplate } from "@prisma/client";
import type { AuthUser } from "@/modules/auth/types";
import type { ClinicalTemplateInput, TemplateDTO } from "@clinic/types";
import {
  VisitsRepository,
  type VisitTx,
  type WorkspaceRow,
} from "./visits.repository";
import { TemplateDto, UpdateTemplateDto } from "./visits.dto";
import { object, storedClinicalSections, validateSections } from "./clinical-validation";
import { visitError } from "./visit-errors";
import { SEED_TEMPLATES } from "./seed-templates";
export const toJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
function storedAssignments(value: unknown): ClinicalTemplateInput["assignments"] {
  if (!object(value)) visitError("clinicalTemplateInvalid");
  const ids = (value: unknown): string[] => {
    if (!Array.isArray(value) || !value.every((id): id is string => typeof id === "string")) {
      visitError("clinicalTemplateInvalid");
    }
    return value;
  };
  return { practitionerIds: ids(value.practitionerIds), departmentIds: ids(value.departmentIds), serviceIds: ids(value.serviceIds) };
}
export const snapshotOf = (row: ClinicalNoteTemplate): ClinicalTemplateInput => ({
  name: row.name,
  nameAr: row.nameAr ?? undefined,
  availableToAll: row.availableToAll,
  assignments: storedAssignments(row.assignments),
  sections: storedClinicalSections(row.sections),
});
export function publishedSnapshot(row: ClinicalNoteTemplate): ClinicalTemplateInput {
  const value = row.published;
  if (!object(value) || typeof value.name !== "string" || typeof value.availableToAll !== "boolean" ||
    (value.nameAr !== undefined && typeof value.nameAr !== "string")) visitError("clinicalTemplateInvalid");
  return { name: value.name, nameAr: value.nameAr, availableToAll: value.availableToAll,
    assignments: storedAssignments(value.assignments), sections: storedClinicalSections(value.sections) };
}
const isPublished = { publishedAt: { not: null } } satisfies Prisma.ClinicalNoteTemplateWhereInput;
@Injectable()
export class TemplatesService {
  constructor(private readonly repo: VisitsRepository) {}
  private owner(actor: AuthUser) {
    if (actor.role !== "owner") visitError("visitForbidden", 403);
  }
  private async defaultId(tx: VisitTx, clinicId: string) {
    const clinic = await tx.clinic.findUniqueOrThrow({ where: { id: clinicId }, select: { defaultNoteTemplateId: true } });
    if (clinic.defaultNoteTemplateId) return clinic.defaultNoteTemplateId;
    const fallback = (await this.publishedRows(tx, clinicId)).find((row) => row.status === "published" && row.availableToAll && publishedSnapshot(row).availableToAll);
    return fallback?.id ?? null;
  }
  private async requireNonDefault(tx: VisitTx, clinicId: string, id: string) {
    if (await this.defaultId(tx, clinicId) === id) visitError("clinicalTemplateDefaultProtected", 409);
  }
  private dto(row: ClinicalNoteTemplate): TemplateDTO {
    return {
      id: row.id,
      clinicId: row.clinicId,
      ...snapshotOf(row),
      status: row.status as TemplateDTO["status"],
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      revision: row.revision,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
  starter(actor: AuthUser): ClinicalTemplateInput {
    this.owner(actor);
    return structuredClone(SEED_TEMPLATES[0]);
  }
  starters(actor: AuthUser): ClinicalTemplateInput[] {
    this.owner(actor);
    return structuredClone(SEED_TEMPLATES);
  }
  async list(actor: AuthUser) {
    this.owner(actor);
    const rows = await this.repo.db.clinicalNoteTemplate.findMany({
      where: { clinicId: actor.clinicId },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((row) => this.dto(row));
  }
  async get(actor: AuthUser, id: string) {
    this.owner(actor);
    const row = await this.repo.db.clinicalNoteTemplate.findFirst({
      where: { id, clinicId: actor.clinicId },
    });
    if (!row) visitError("clinicalTemplateNotFound", 404);
    return this.dto(row);
  }
  private async validate(tx: VisitTx, clinicId: string, input: TemplateDto) {
    if (!input.name.trim()) visitError("clinicalTemplateInvalid");
    if (!input.availableToAll && !Object.values(input.assignments).some((ids) => ids.length)) visitError("clinicalTemplateAssignmentInvalid");
    validateSections(input.sections);
    const refs = input.assignments;
    const counts = await Promise.all([
      tx.clinicUser.count({
        where: {
          id: { in: [...new Set(refs.practitionerIds)] },
          clinicId,
          role: "practitioner",
          isActive: true,
        },
      }),
      tx.department.count({
        where: { id: { in: [...new Set(refs.departmentIds)] }, clinicId },
      }),
      tx.service.count({
        where: { id: { in: [...new Set(refs.serviceIds)] }, clinicId },
      }),
    ]);
    if (
      counts.some(
        (count, index) =>
          count !==
          new Set(
            [refs.practitionerIds, refs.departmentIds, refs.serviceIds][index],
          ).size,
      )
    )
      visitError("clinicalTemplateAssignmentInvalid");
  }
  async create(actor: AuthUser, input: TemplateDto) {
    this.owner(actor);
    return this.repo.transaction(async (tx) => {
      await this.validate(tx, actor.clinicId, input);
      return this.dto(
        await tx.clinicalNoteTemplate.create({
          data: {
            clinicId: actor.clinicId,
            ...input,
            name: input.name.trim(),
            assignments: toJson(input.assignments),
            sections: toJson(input.sections),
          },
        }),
      );
    });
  }
  async update(actor: AuthUser, id: string, input: UpdateTemplateDto) {
    this.owner(actor);
    return this.repo.transaction(async (tx) => {
      const isDefault = await this.defaultId(tx, actor.clinicId) === id;
      if (isDefault && !input.availableToAll) visitError("clinicalTemplateDefaultProtected", 409);
      await this.validate(tx, actor.clinicId, input);
      const { revision, ...data } = input;
      const result = await tx.clinicalNoteTemplate.updateMany({
        where: {
          id,
          clinicId: actor.clinicId,
          revision,
          status: { not: "archived" },
        },
        data: {
          ...data,
          name: data.name.trim(),
          assignments: toJson(data.assignments),
          sections: toJson(data.sections),
          status: isDefault ? "published" : "draft",
          ...(isDefault ? { published: toJson({ ...data, name: data.name.trim() }), publishedAt: new Date() } : {}),
          scheduledAt: null,
          revision: { increment: 1 },
        },
      });
      if (!result.count) visitError("visitRevisionConflict", 409);
      return this.dto(await tx.clinicalNoteTemplate.findUniqueOrThrow({ where: { id } }));
    });
  }
  async publishNow(tx: VisitTx, clinicId: string, row: ClinicalNoteTemplate) {
    if (!row.availableToAll) await this.requireNonDefault(tx, clinicId, row.id);
    const updated = await tx.clinicalNoteTemplate.updateMany({
      where: { id: row.id, clinicId, revision: row.revision },
      data: {
        revision: { increment: 1 },
        status: "published",
        scheduledAt: null,
        published: toJson(snapshotOf(row)),
        publishedAt: new Date(),
      },
    });
    if (!updated.count) visitError("visitRevisionConflict", 409);
    if (row.availableToAll) await tx.clinic.updateMany({
      where: { id: clinicId, defaultNoteTemplateId: null }, data: { defaultNoteTemplateId: row.id },
    });
    return this.dto(await tx.clinicalNoteTemplate.findUniqueOrThrow({ where: { id: row.id } }));
  }
  async publish(actor: AuthUser, id: string, revision: number) {
    this.owner(actor);
    return this.repo.transaction(async (tx) => {
      const row = await tx.clinicalNoteTemplate.findFirst({
        where: {
          id,
          clinicId: actor.clinicId,
          revision,
          status: { not: "archived" },
        },
      });
      if (!row) visitError("visitRevisionConflict", 409);
      await this.validate(tx, actor.clinicId, snapshotOf(row));
      return this.publishNow(tx, actor.clinicId, row);
    });
  }
  async schedule(
    actor: AuthUser,
    id: string,
    revision: number,
    scheduledAt: Date,
  ) {
    this.owner(actor);
    if (!(scheduledAt.getTime() > Date.now()))
      visitError("clinicalTemplateInvalid");
    return this.repo.transaction(async (tx) => {
      await this.requireNonDefault(tx, actor.clinicId, id);
      const row = await tx.clinicalNoteTemplate.findFirst({
        where: {
          id,
          clinicId: actor.clinicId,
          revision,
          status: { not: "archived" },
        },
      });
      if (!row) visitError("visitRevisionConflict", 409);
      await this.validate(tx, actor.clinicId, snapshotOf(row));
      const updated = await tx.clinicalNoteTemplate.updateMany({
        where: { id, clinicId: actor.clinicId, revision },
        data: {
          status: "scheduled",
          scheduledAt,
          revision: { increment: 1 },
        },
      });
      if (!updated.count) visitError("visitRevisionConflict", 409);
      return this.dto(await tx.clinicalNoteTemplate.findUniqueOrThrow({ where: { id, clinicId: actor.clinicId } }));
    });
  }
  async promoteScheduled(now: Date) {
    const due = await this.repo.db.clinicalNoteTemplate.findMany({
      where: { status: "scheduled", scheduledAt: { lte: now } },
      orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
      take: 100,
    });
    for (const row of due) {
      try {
        await this.repo.transaction(async (tx) => {
          const current = await tx.clinicalNoteTemplate.findFirst({
            where: { id: row.id, clinicId: row.clinicId, status: "scheduled", scheduledAt: { lte: now } },
          });
          if (!current) return;
          validateSections(current.sections);
          await this.publishNow(tx, current.clinicId, current);
        });
      } catch (error) {
        if (!(error instanceof HttpException) || error.getStatus() !== 400) throw error;
        await this.repo.db.clinicalNoteTemplate.updateMany({
          where: { id: row.id, clinicId: row.clinicId, status: "scheduled", revision: row.revision, scheduledAt: { lte: now } },
          data: { status: "draft", scheduledAt: null, revision: { increment: 1 } },
        });
      }
    }
    return due.length;
  }
  async archive(actor: AuthUser, id: string, revision: number) {
    this.owner(actor);
    await this.repo.transaction(async (tx) => {
      await this.requireNonDefault(tx, actor.clinicId, id);
      const result = await tx.clinicalNoteTemplate.updateMany({
        where: { id, clinicId: actor.clinicId, revision, status: { not: "archived" } },
        data: { status: "archived", scheduledAt: null, revision: { increment: 1 } },
      });
      if (!result.count) visitError("visitRevisionConflict", 409);
      await tx.clinicUser.updateMany({ where: { clinicId: actor.clinicId, defaultNoteTemplateId: id }, data: { defaultNoteTemplateId: null } });
    });
    return this.get(actor, id);
  }
  async remove(actor: AuthUser, id: string) {
    this.owner(actor);
    await this.repo.transaction(async (tx) => {
      await this.requireNonDefault(tx, actor.clinicId, id);
      const row = await tx.clinicalNoteTemplate.findFirst({ where: { id, clinicId: actor.clinicId }, select: { id: true } });
      if (!row) visitError("clinicalTemplateNotFound", 404);
      if (await tx.clinicalNote.count({ where: { templateId: id, clinicId: actor.clinicId } })) visitError("clinicalTemplateInUse", 409);
      await tx.clinicUser.updateMany({ where: { clinicId: actor.clinicId, defaultNoteTemplateId: id }, data: { defaultNoteTemplateId: null } });
      await tx.clinicalNoteTemplate.delete({ where: { id_clinicId: { id, clinicId: actor.clinicId } } });
    });
    return { id };
  }
  async draft(actor: AuthUser, id: string, revision: number, restore = false) {
    this.owner(actor);
    return this.repo.transaction(async (tx) => {
      await this.requireNonDefault(tx, actor.clinicId, id);
      const result = await tx.clinicalNoteTemplate.updateMany({
        where: { id, clinicId: actor.clinicId, revision, status: restore ? "archived" : { not: "archived" } },
        data: { status: "draft", scheduledAt: null, publishedAt: null, published: Prisma.DbNull, revision: { increment: 1 } },
      });
      if (!result.count) visitError("visitRevisionConflict", 409);
      await tx.clinicUser.updateMany({ where: { clinicId: actor.clinicId, defaultNoteTemplateId: id }, data: { defaultNoteTemplateId: null } });
      return this.dto(await tx.clinicalNoteTemplate.findUniqueOrThrow({ where: { id, clinicId: actor.clinicId } }));
    });
  }
  async clone(actor: AuthUser, id: string) {
    const row = await this.get(actor, id);
    return this.create(actor, {
      name: `${row.name.slice(0, 110)} (copy)`,
      nameAr: row.nameAr,
      availableToAll: row.availableToAll,
      assignments: row.assignments,
      sections: row.sections,
    });
  }
  private live(row: ClinicalNoteTemplate) {
    return { ...this.dto(row), ...publishedSnapshot(row), status: "published" as const };
  }
  private publishedRows(db: Pick<VisitTx, "clinicalNoteTemplate">, clinicId: string) {
    return db.clinicalNoteTemplate.findMany({
      where: { clinicId, status: { not: "archived" }, ...isPublished },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  }
  async allowed(tx: VisitTx, row: Pick<WorkspaceRow, "clinicId" | "doctorId" | "departmentId" | "serviceId">) {
    const rows = await this.publishedRows(tx, row.clinicId);
    return rows
      .filter((template) => {
        const refs = publishedSnapshot(template);
        return (
          refs.availableToAll ||
          refs.assignments.practitionerIds.includes(row.doctorId) ||
          (!!row.departmentId && refs.assignments.departmentIds.includes(row.departmentId)) ||
          (!!row.serviceId && refs.assignments.serviceIds.includes(row.serviceId))
        );
      })
      .map((template) => this.live(template));
  }
  async available(actor: AuthUser, appointmentId?: string, membership?: { id: string; departmentId: string | null; services: { serviceId: string }[] }) {
    if (appointmentId)
      return this.repo.transaction(async (tx) =>
        this.allowed(tx, await this.repo.templateScope(tx, actor, appointmentId)),
      );
    const rows = await this.publishedRows(this.repo.db, actor.clinicId);
    if (actor.role !== "practitioner") {
      this.owner(actor);
      return rows.map((row) => this.live(row));
    }
    const practitioner = membership ?? await this.repo.db.clinicUser.findFirstOrThrow({
      where: { id: actor.clinicUserId, clinicId: actor.clinicId },
      include: { services: true },
    });
    return rows
      .filter((row) => {
        const snap = publishedSnapshot(row);
        return (
          snap.availableToAll ||
          snap.assignments.practitionerIds.includes(practitioner.id) ||
          snap.assignments.departmentIds.includes(practitioner.departmentId ?? "") ||
          practitioner.services.some((service) => snap.assignments.serviceIds.includes(service.serviceId))
        );
      })
      .map((row) => this.live(row));
  }
  async clinicDefault(actor: AuthUser, templateId?: string | null) {
    this.owner(actor);
    return this.repo.transaction(async (tx) => {
      if (templateId !== undefined) {
        if (!templateId) visitError("clinicalTemplateInvalid");
        const row = await tx.clinicalNoteTemplate.findFirst({
          where: { id: templateId, clinicId: actor.clinicId, status: "published", ...isPublished },
        });
        if (!row || !row.availableToAll || !publishedSnapshot(row).availableToAll) visitError("clinicalTemplateUnavailable", 403);
        await tx.clinic.update({ where: { id: actor.clinicId }, data: { defaultNoteTemplateId: templateId } });
      }
      return { templateId: await this.defaultId(tx, actor.clinicId) };
    });
  }
  async defaultForVisit(tx: VisitTx, row: Pick<WorkspaceRow, "clinicId" | "doctorId" | "departmentId" | "serviceId">) {
    const doctor = await tx.clinicUser.findFirstOrThrow({
      where: { id: row.doctorId, clinicId: row.clinicId },
      select: { defaultNoteTemplateId: true, clinic: { select: { defaultNoteTemplateId: true } } },
    });
    const available = await this.allowed(tx, row);
    return available.find((item) => item.id === doctor.defaultNoteTemplateId)
      ?? available.find((item) => item.id === doctor.clinic.defaultNoteTemplateId)
      ?? available.find((item) => item.availableToAll) ?? available[0];
  }
  async preference(actor: AuthUser, templateId?: string | null) {
    if (actor.role !== "practitioner") visitError("visitForbidden", 403);
    const membership = await this.repo.db.clinicUser.findFirstOrThrow({
      where: { id: actor.clinicUserId, clinicId: actor.clinicId },
      select: { id: true, departmentId: true, defaultNoteTemplateId: true,
        services: { select: { serviceId: true } }, clinic: { select: { defaultNoteTemplateId: true } } },
    });
    const available = await this.available(actor, undefined, membership);
    if (templateId && !available.some((item) => item.id === templateId)) visitError("clinicalTemplateUnavailable", 403);
    if (templateId !== undefined) await this.repo.db.clinicUser.updateMany({
      where: { id: actor.clinicUserId, clinicId: actor.clinicId }, data: { defaultNoteTemplateId: templateId },
    });
    const personal = templateId === undefined ? membership.defaultNoteTemplateId : templateId;
    const clinic = available.find((item) => item.id === membership.clinic.defaultNoteTemplateId)
      ?? available.find((item) => item.availableToAll);
    const effective = available.find((item) => item.id === personal) ?? clinic ?? available[0];
    return { templateId: personal, effectiveTemplateId: effective?.id ?? null, clinicTemplateId: clinic?.id ?? null };
  }
}
