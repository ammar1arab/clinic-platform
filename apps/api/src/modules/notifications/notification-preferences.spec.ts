import { notificationCategoriesForRole, notificationCategoryOf, resolveNotificationPrefs } from "@clinic/types";
import type { PrismaService } from "@/prisma/prisma.service";
import { NotificationsRepository } from "./notifications.repository";

describe("Notification preference roles", () => {
  it("separates practitioner, owner and admin controls", () => {
    expect(notificationCategoriesForRole("practitioner")).toEqual(expect.arrayContaining(["appointments", "queue", "referrals", "documentation", "scheduleRequests"]));
    expect(notificationCategoriesForRole("owner")).toEqual(["documentation", "scheduleRequests"]);
    expect(notificationCategoriesForRole("admin")).toEqual(["scheduleRequests"]);
    expect(notificationCategoryOf("schedule_request_approved")).toBe("scheduleRequests");
    expect(resolveNotificationPrefs({ scheduleRequests: false }).scheduleRequests).toBe(false);
  });
  it("preserves hidden preferences when a different role updates its controls", async () => {
    const clinicUser = {
      findFirstOrThrow: jest.fn().mockResolvedValue({ role: "owner", notificationPrefs: { appointments: false } }),
      update: jest.fn(),
    };
    const repo = new NotificationsRepository({ clinicUser } as unknown as PrismaService);
    const result = await repo.setPreferences("clinic", "owner", { appointments: true, scheduleRequests: false });
    expect(result.appointments).toBe(false);
    expect(result.scheduleRequests).toBe(false);
    expect(clinicUser.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "owner", clinicId: "clinic" } }));
  });
});
