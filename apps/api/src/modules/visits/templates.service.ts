import { Injectable } from "@nestjs/common";
import {
  Prisma,
  type ClinicalNoteTemplate,
  type ClinicalTemplateVersion,
} from "@prisma/client";
import type { AuthUser } from "@/modules/auth/types";
import type {
  ClinicalTemplateInput,
  TemplateDTO,
  TemplateVersionDTO,
} from "@clinic/types";
import {
  VisitsRepository,
  type VisitTx,
  type WorkspaceRow,
} from "./visits.repository";
import { TemplateDto, UpdateTemplateDto } from "./visits.dto";
import { validateSections } from "./clinical-validation";
import { visitError } from "./visit-errors";
export const toJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export const snapshotOf = (
  row: ClinicalNoteTemplate,
): ClinicalTemplateInput => ({
  name: row.name,
  nameAr: row.nameAr ?? undefined,
  availableToAll: row.availableToAll,
  assignments:
    row.assignments as unknown as ClinicalTemplateInput["assignments"],
  sections: row.sections as unknown as ClinicalTemplateInput["sections"],
});
export const versionSnapshot = (version: ClinicalTemplateVersion) =>
  version.snapshot as unknown as ClinicalTemplateInput;
@Injectable()
export class TemplatesService {
  constructor(private readonly repo: VisitsRepository) {}
  private owner(actor: AuthUser) {
    if (actor.role !== "owner") visitError("visitForbidden", 403);
  }
  private dto(
    row: ClinicalNoteTemplate,
    latest?: ClinicalTemplateVersion | null,
  ): TemplateDTO {
    return {
      id: row.id,
      clinicId: row.clinicId,
      ...snapshotOf(row),
      status: row.status as TemplateDTO["status"],
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      revision: row.revision,
      version: row.version,
      publishedVersionId: latest?.id ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
  starter(actor: AuthUser): ClinicalTemplateInput {
    this.owner(actor);
    return {
      name: "Clinical consultation",
      nameAr: "توثيق المعاينة",
      availableToAll: true,
      assignments: { practitionerIds: [], departmentIds: [], serviceIds: [] },
      sections: [
        {
          id: "presentation",
          title: "Presentation",
          titleAr: "سبب الزيارة",
          fields: [
            {
              id: "reason",
              label: "Reason for visit",
              labelAr: "سبب الزيارة",
              type: "textarea",
              required: true,
            },
          ],
        },
        {
          id: "history",
          title: "History and examination",
          titleAr: "التاريخ والفحص",
          fields: [
            {
              id: "history",
              label: "Relevant history",
              labelAr: "التاريخ المرضي",
              type: "textarea",
              required: false,
            },
            {
              id: "examination",
              label: "Examination findings",
              labelAr: "نتائج الفحص",
              type: "textarea",
              required: false,
            },
          ],
        },
        {
          id: "assessment_plan",
          title: "Assessment and plan",
          titleAr: "التقييم والخطة",
          fields: [
            {
              id: "assessment",
              label: "Assessment",
              labelAr: "التقييم",
              type: "textarea",
              required: true,
            },
            {
              id: "plan",
              label: "Plan",
              labelAr: "الخطة",
              type: "textarea",
              required: true,
            },
            {
              id: "followUp",
              label: "Follow-up",
              labelAr: "المتابعة",
              type: "textarea",
              required: false,
            },
            {
              id: "summary",
              label: "Patient-facing summary",
              labelAr: "الخلاصة الموجهة للمريض",
              type: "textarea",
              required: false,
            },
          ],
        },
      ],
    };
  }
  async list(actor: AuthUser) {
    this.owner(actor);
    const rows = await this.repo.db.clinicalNoteTemplate.findMany({
      where: { clinicId: actor.clinicId },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((row) => this.dto(row, row.versions[0]));
  }
  async get(actor: AuthUser, id: string) {
    this.owner(actor);
    const row = await this.repo.db.clinicalNoteTemplate.findFirst({
      where: { id, clinicId: actor.clinicId },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!row) visitError("clinicalTemplateNotFound", 404);
    return this.dto(row, row.versions[0]);
  }
  async versions(actor: AuthUser, id: string): Promise<TemplateVersionDTO[]> {
    await this.get(actor, id);
    return (
      await this.repo.db.clinicalTemplateVersion.findMany({
        where: { templateId: id, clinicId: actor.clinicId },
        orderBy: { version: "desc" },
      })
    ).map((row) => ({
      id: row.id,
      templateId: row.templateId,
      version: row.version,
      snapshot: versionSnapshot(row),
      createdAt: row.createdAt.toISOString(),
    }));
  }
  private async validate(tx: VisitTx, clinicId: string, input: TemplateDto) {
    if (!input.name.trim()) visitError("clinicalTemplateInvalid");
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
          status: "draft",
          scheduledAt: null,
          revision: { increment: 1 },
        },
      });
      if (!result.count) visitError("visitRevisionConflict", 409);
      const updated = await tx.clinicalNoteTemplate.findUniqueOrThrow({
        where: { id },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      });
      return this.dto(updated, updated.versions[0]);
    });
  }
  async publishNow(tx: VisitTx, clinicId: string, row: ClinicalNoteTemplate) {
    const updated = await tx.clinicalNoteTemplate.updateMany({
      where: { id: row.id, clinicId, revision: row.revision },
      data: {
        version: { increment: 1 },
        revision: { increment: 1 },
        status: "published",
        scheduledAt: null,
      },
    });
    if (!updated.count) visitError("visitRevisionConflict", 409);
    const version = await tx.clinicalTemplateVersion.create({
      data: {
        clinicId,
        templateId: row.id,
        version: row.version + 1,
        snapshot: toJson(snapshotOf(row)),
      },
    });
    return this.dto(
      await tx.clinicalNoteTemplate.findUniqueOrThrow({ where: { id: row.id } }),
      version,
    );
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
      const scheduled = await tx.clinicalNoteTemplate.findUniqueOrThrow({
        where: { id, clinicId: actor.clinicId },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      });
      return this.dto(scheduled, scheduled.versions[0]);
    });
  }
  async promoteScheduled(now: Date) {
    const due = await this.repo.db.clinicalNoteTemplate.findMany({
      where: { status: "scheduled", scheduledAt: { lte: now } },
      orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
      take: 100,
    });
    for (const row of due) {
      await this.repo.transaction(async (tx) => {
        const current = await tx.clinicalNoteTemplate.findFirst({
          where: { id: row.id, clinicId: row.clinicId, status: "scheduled", scheduledAt: { lte: now } },
        });
        if (!current) return;
        validateSections(current.sections);
        await this.publishNow(tx, current.clinicId, current);
      });
    }
    return due.length;
  }
  async archive(actor: AuthUser, id: string, revision: number) {
    this.owner(actor);
    const result = await this.repo.db.clinicalNoteTemplate.updateMany({
      where: { id, clinicId: actor.clinicId, revision },
      data: { status: "archived", scheduledAt: null, revision: { increment: 1 } },
    });
    if (!result.count) visitError("visitRevisionConflict", 409);
    return this.get(actor, id);
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
  async allowed(tx: VisitTx, row: WorkspaceRow) {
    const versions = await tx.clinicalNoteTemplate.findMany({
      where: {
        clinicId: row.clinicId,
        status: { not: "archived" },
        version: { gt: 0 },
      },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    return versions.flatMap((template) => {
      const version = template.versions[0];
      if (!version) return [];
      const snapshot = versionSnapshot(version);
      const refs = snapshot.assignments;
      const matches =
        snapshot.availableToAll ||
        refs.practitionerIds.includes(row.doctorId) ||
        (!!row.departmentId && refs.departmentIds.includes(row.departmentId)) ||
        (!!row.serviceId && refs.serviceIds.includes(row.serviceId));
      return matches
        ? [
            {
              ...this.dto(template, version),
              ...snapshot,
              status: "published" as const,
            },
          ]
        : [];
    });
  }
  async available(actor: AuthUser, appointmentId?: string) {
    if (appointmentId)
      return this.repo.transaction(async (tx) =>
        this.allowed(tx, await this.repo.appointment(tx, actor, appointmentId)),
      );
    if (actor.role !== "practitioner") {
      this.owner(actor);
      const rows = await this.repo.db.clinicalNoteTemplate.findMany({
        where: {
          clinicId: actor.clinicId,
          version: { gt: 0 },
          status: { not: "archived" },
        },
        include: { versions: { take: 1, orderBy: { version: "desc" } } },
      });
      return rows.flatMap((row) =>
        row.versions[0]
          ? [
              {
                ...this.dto(row, row.versions[0]),
                ...versionSnapshot(row.versions[0]),
                status: "published" as const,
              },
            ]
          : [],
      );
    }
    const practitioner = await this.repo.db.clinicUser.findFirstOrThrow({
      where: { id: actor.clinicUserId, clinicId: actor.clinicId },
      include: { services: true },
    });
    const rows = await this.repo.db.clinicalNoteTemplate.findMany({
      where: {
        clinicId: actor.clinicId,
        status: { not: "archived" },
        version: { gt: 0 },
      },
      include: { versions: { take: 1, orderBy: { version: "desc" } } },
    });
    return rows.flatMap((row) => {
      const version = row.versions[0];
      if (!version) return [];
      const snap = versionSnapshot(version);
      const matches =
        snap.availableToAll ||
        snap.assignments.practitionerIds.includes(practitioner.id) ||
        snap.assignments.departmentIds.includes(
          practitioner.departmentId ?? "",
        ) ||
        practitioner.services.some((service) =>
          snap.assignments.serviceIds.includes(service.serviceId),
        );
      return matches
        ? [{ ...this.dto(row, version), ...snap, status: "published" as const }]
        : [];
    });
  }
  async preference(actor: AuthUser, templateId?: string | null) {
    if (actor.role !== "practitioner") visitError("visitForbidden", 403);
    if (templateId !== undefined) {
      if (templateId) {
        const row = await this.repo.db.clinicalNoteTemplate.findFirst({
          where: {
            id: templateId,
            clinicId: actor.clinicId,
            version: { gt: 0 },
            status: { not: "archived" },
          },
          include: { versions: { orderBy: { version: "desc" }, take: 1 } },
        });
        if (!row?.versions[0]) visitError("clinicalTemplateNotFound", 404);
        const snap = versionSnapshot(row.versions[0]);
        const practitioner = await this.repo.db.clinicUser.findFirstOrThrow({
          where: { id: actor.clinicUserId, clinicId: actor.clinicId },
          include: { services: true },
        });
        if (
          !snap.availableToAll &&
          !snap.assignments.practitionerIds.includes(practitioner.id) &&
          !snap.assignments.departmentIds.includes(
            practitioner.departmentId ?? "",
          ) &&
          !practitioner.services.some((service) =>
            snap.assignments.serviceIds.includes(service.serviceId),
          )
        )
          visitError("clinicalTemplateUnavailable", 403);
      }
      await this.repo.db.clinicUser.updateMany({
        where: { id: actor.clinicUserId, clinicId: actor.clinicId },
        data: { defaultNoteTemplateId: templateId },
      });
    }
    const row = await this.repo.db.clinicUser.findFirstOrThrow({
      where: { id: actor.clinicUserId, clinicId: actor.clinicId },
    });
    return { templateId: row.defaultNoteTemplateId };
  }
}
