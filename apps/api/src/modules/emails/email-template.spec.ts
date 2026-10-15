import { LOCALE, type EmailBrandDetails } from "@clinic/types";
import { renderEmail } from "./email-template";
import { shouldApplyDelivery } from "./email-webhooks.service";

const createBrandFixture = (
  overrides?: Partial<EmailBrandDetails>,
): EmailBrandDetails => ({
  name: "Cureva Clinic",
  nameAr: "عيادة كيوريفا",
  logoUrl: null,
  timezone: "Asia/Amman",
  ...overrides,
});

describe("Email rendering and delivery ordering", () => {
  it("escapes content and personalized values", () => {
    const brand = createBrandFixture();
    const output = renderEmail(
      {
        locale: LOCALE.EN,
        subject: "Hello {{recipientName}}",
        body: "<script>alert(1)</script>\n{{clinicName}}",
      },
      brand,
      '<img src=x onerror="bad">',
    );

    expect(output.html).not.toContain("<script>");
    expect(output.html).toContain("&lt;script&gt;");
    expect(output.html).toContain("&lt;img");
    expect(output.text).toContain("<script>");
  });

  it("uses Arabic clinic name and RTL", () => {
    const brand = createBrandFixture();
    const output = renderEmail(
      {
        locale: LOCALE.AR,
        subject: "{{clinicName}}",
        body: "مرحباً {{recipientName}}",
      },
      brand,
      "أحمد",
    );

    expect(output.html).toContain('dir="rtl"');
    expect(output.subject).toBe("عيادة كيوريفا");
    expect(output.text).toContain("أحمد");
  });

  it("refuses unknown placeholders", () => {
    const brand = createBrandFixture();
    expect(() =>
      renderEmail(
        {
          locale: LOCALE.EN,
          subject: "Hello",
          body: "{{patientDiagnosis}}",
        },
        brand,
        "A",
      ),
    ).toThrow();
  });

  it("ignores unsafe branding URLs and escapes the footer", () => {
    const brand = createBrandFixture({
      websiteUrl: "javascript:alert(1)",
      logoUrl: "https://user:pass@example.com/x",
      footerEn: "<strong>footer</strong>",
      linkedinUrl: "https://linkedin.com/company/test",
    });

    const output = renderEmail(
      {
        locale: LOCALE.EN,
        subject: "Hi",
        body: "Body",
      },
      brand,
      "A",
    );

    expect(output.html).not.toContain("javascript:");
    expect(output.html).not.toContain("user:pass");
    expect(output.html).toContain("&lt;strong&gt;footer");
    expect(output.html).toContain("https://linkedin.com/company/test");
  });

  it("does not recursively resolve recipient placeholders", () => {
    const brand = createBrandFixture();
    const output = renderEmail(
      {
        locale: LOCALE.EN,
        subject: "{{recipientName}}",
        body: "Body",
      },
      brand,
      "{{clinicName}}",
    );

    expect(output.subject).toBe("{{clinicName}}");
  });

  it.each([
    ["delivered", "accepted", false],
    ["delivered", "delayed", false],
    ["delivered", "bounced", true],
    ["bounced", "delivered", false],
    ["complained", "delivered", false],
    ["delivered", "complained", true],
    ["accepted", "delivered", true],
    ["failed", "accepted", false],
  ] as const)(
    "orders %s -> %s",
    (current, next, expected) => {
      expect(
        shouldApplyDelivery(
          current,
          next,
          null,
          new Date(),
        ),
      ).toBe(expected);
    },
  );

  it("ignores older nonterminal events", () => {
    expect(
      shouldApplyDelivery(
        "delayed",
        "accepted",
        new Date("2026-10-15"),
        new Date("2026-10-14"),
      ),
    ).toBe(false);
  });
});
