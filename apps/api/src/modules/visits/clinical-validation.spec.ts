import { storedClinicalSections, storedReportSections, storedInvoiceLines, validateSections, validateValues } from "./clinical-validation";
import type { ClinicalSection } from "@clinic/types";
import { SEED_TEMPLATES } from "./seed-templates";

describe("validateSections", () => {
  it.each(SEED_TEMPLATES.map((template) => [template.name, template.sections] as const))(
    "accepts the ready-made template %s",
    (_name, sections) => {
      expect(() => validateSections(sections)).not.toThrow();
    },
  );

  it("allows a section and a field to share an id", () => {
    expect(() =>
      validateSections([
        { id: "reason", title: "Reason", fields: [{ id: "reason", label: "Complaint", type: "text", required: false }] },
      ]),
    ).not.toThrow();
  });

  it("rejects duplicate field ids across sections", () => {
    expect(() =>
      validateSections([
        { id: "a", title: "A", fields: [{ id: "x", label: "X", type: "text", required: false }] },
        { id: "b", title: "B", fields: [{ id: "x", label: "X", type: "text", required: false }] },
      ]),
    ).toThrow();
  });

  it("rejects an empty template", () => {
    expect(() => validateSections([])).toThrow();
  });

  describe("new field types", () => {
    const sections: ClinicalSection[] = [
      {
        id: "s",
        title: "S",
        fields: [
          { id: "pain", label: "Pain", type: "scale", required: false },
          { id: "onset", label: "Onset", type: "time", required: false },
          { id: "meds", label: "Medications", type: "medications", required: false },
        ],
      },
    ];

    it("accepts the template", () => {
      expect(() => validateSections(sections)).not.toThrow();
    });

    it("accepts valid values", () => {
      expect(() =>
        validateValues(sections, { pain: 7, onset: "08:30", meds: [{ drug: "Paracetamol", dose: "500 mg", frequency: "Twice daily" }] }),
      ).not.toThrow();
    });

    it.each([
      [{ pain: 11 }],
      [{ pain: 2.5 }],
      [{ onset: "25:00" }],
      [{ meds: [{ drug: "", dose: "1", frequency: "1" }] }],
      [{ meds: [{ drug: "A", extra: "x" }] }],
    ])("rejects %j", (values) => {
      expect(() => validateValues(sections, values)).toThrow();
    });
  });
});

describe("stored clinical JSON", () => {
  it("rejects corrupted stored sections before note rendering", () => {
    expect(() => storedClinicalSections([{ title: "Broken", fields: null }])).toThrow();
  });
  it("rejects non-text report fields", () => {
    expect(() => storedReportSections({ reason: 42 })).toThrow();
  });
  it("rejects invoice lines that omit totals", () => {
    expect(() => storedInvoiceLines([{ id: "line", description: "Visit", quantity: "1", unitPrice: "25" }])).toThrow();
  });
  it("preserves the stored monetary strings", () => {
    const lines = [{ id: "line", description: "Visit", quantity: "1", unitPrice: "25.000", total: "25.000" }];
    expect(storedInvoiceLines(lines)).toEqual(lines);
  });
});
