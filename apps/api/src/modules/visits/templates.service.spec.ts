import { Prisma, type ClinicalNoteTemplate } from "@prisma/client";
import type { AuthUser } from "@/modules/auth/types";
import { SEED_TEMPLATES } from "./seed-templates";
import { TemplatesService, toJson } from "./templates.service";
import { VisitsRepository, type VisitTx } from "./visits.repository";

const actor: AuthUser = { userId: "user", clinicUserId: "owner", clinicId: "clinic", role: "owner" };
const input = SEED_TEMPLATES[0];
const makeRow = (patch: Partial<ClinicalNoteTemplate> = {}): ClinicalNoteTemplate => ({
  id: "template", clinicId: actor.clinicId, name: input.name, nameAr: null,
  availableToAll: true, assignments: toJson(input.assignments) as Prisma.JsonObject,
  sections: toJson(input.sections) as Prisma.JsonArray,
  published: toJson(input) as Prisma.JsonObject, publishedAt: new Date(),
  status: "published", scheduledAt: null, revision: 2, createdAt: new Date(), updatedAt: new Date(),
  ...patch,
});

describe("template lifecycle", () => {
  const template = {
    findFirst: jest.fn(), findMany: jest.fn(), findUniqueOrThrow: jest.fn(),
    updateMany: jest.fn(), delete: jest.fn(),
  };
  const clinic = { findUniqueOrThrow: jest.fn(), update: jest.fn(), updateMany: jest.fn() };
  const clinicUser = { count: jest.fn(), updateMany: jest.fn() };
  const note = { count: jest.fn() };
  const tx = { clinicalNoteTemplate: template, clinic, clinicUser, clinicalNote: note,
    department: { count: jest.fn() }, service: { count: jest.fn() } };
  const repo = { db: tx, transaction: <T>(run: (client: VisitTx) => Promise<T>) => run(tx as unknown as VisitTx) };
  const service = new TemplatesService(repo as unknown as VisitsRepository);

  beforeEach(() => {
    jest.resetAllMocks();
    clinic.findUniqueOrThrow.mockResolvedValue({ defaultNoteTemplateId: "template" });
    template.findFirst.mockResolvedValue(makeRow());
    template.findMany.mockResolvedValue([]);
    template.findUniqueOrThrow.mockResolvedValue(makeRow());
    template.updateMany.mockResolvedValue({ count: 1 });
    clinicUser.count.mockResolvedValue(0);
    tx.department.count.mockResolvedValue(0);
    tx.service.count.mockResolvedValue(0);
    note.count.mockResolvedValue(0);
  });

  it.each(["draft", "archive", "remove", "schedule"] as const)("protects the clinic default from %s", async (action) => {
    const request = action === "remove" ? service.remove(actor, "template")
      : action === "schedule" ? service.schedule(actor, "template", 2, new Date(Date.now() + 60_000))
        : service[action](actor, "template", 2);
    await expect(request).rejects.toMatchObject({ response: { code: "clinicalTemplateDefaultProtected" } });
    expect(template.updateMany).not.toHaveBeenCalled();
    expect(template.delete).not.toHaveBeenCalled();
  });

  it("keeps valid default edits published for every practitioner", async () => {
    await service.update(actor, "template", { ...input, revision: 2 });
    expect(template.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "published", availableToAll: true, published: expect.objectContaining({ availableToAll: true }) }),
    }));
  });

  it("rejects restricting the default audience", async () => {
    await expect(service.update(actor, "template", { ...input, availableToAll: false, revision: 2 }))
      .rejects.toMatchObject({ response: { code: "clinicalTemplateDefaultProtected" } });
    expect(template.updateMany).not.toHaveBeenCalled();
  });

  it("allows drafting the former default after a replacement is chosen", async () => {
    clinic.findUniqueOrThrow.mockResolvedValue({ defaultNoteTemplateId: "replacement" });
    await service.draft(actor, "template", 2);
    expect(template.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ clinicId: actor.clinicId, revision: 2, status: { not: "archived" } }),
      data: expect.objectContaining({ status: "draft", publishedAt: null, published: Prisma.DbNull, scheduledAt: null }),
    }));
    expect(clinicUser.updateMany).toHaveBeenCalled();
  });

  it("restores only archived templates to an unpublished draft", async () => {
    clinic.findUniqueOrThrow.mockResolvedValue({ defaultNoteTemplateId: "replacement" });
    await service.draft(actor, "template", 2, true);
    expect(template.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "template", clinicId: actor.clinicId, revision: 2, status: "archived" },
      data: expect.objectContaining({ status: "draft", publishedAt: null, published: Prisma.DbNull }),
    }));
  });

  it("rejects stale restore requests", async () => {
    clinic.findUniqueOrThrow.mockResolvedValue({ defaultNoteTemplateId: "replacement" });
    template.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.draft(actor, "template", 1, true)).rejects.toMatchObject({ response: { code: "visitRevisionConflict" } });
    expect(clinicUser.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a scoped template as the new default", async () => {
    template.findFirst.mockResolvedValue(makeRow({ availableToAll: false }));
    await expect(service.clinicDefault(actor, "template")).rejects.toMatchObject({ response: { code: "clinicalTemplateUnavailable" } });
    expect(clinic.update).not.toHaveBeenCalled();
  });

  it("protects the effective fallback default when no default is stored", async () => {
    clinic.findUniqueOrThrow.mockResolvedValue({ defaultNoteTemplateId: null });
    template.findMany.mockResolvedValue([makeRow()]);
    await expect(service.archive(actor, "template", 2)).rejects.toMatchObject({ response: { code: "clinicalTemplateDefaultProtected" } });
  });

  it("keeps archived templates out of practitioner availability", async () => {
    await service.available(actor);
    expect(template.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ clinicId: actor.clinicId, status: { not: "archived" }, publishedAt: { not: null } }),
    }));
  });

  it("rejects lifecycle mutations from practitioners", async () => {
    await expect(service.draft({ ...actor, role: "practitioner" }, "template", 2, true))
      .rejects.toMatchObject({ response: { code: "visitForbidden" } });
    expect(template.updateMany).not.toHaveBeenCalled();
  });
});
