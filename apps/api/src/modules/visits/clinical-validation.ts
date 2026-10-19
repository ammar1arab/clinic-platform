import type {
  ClinicalSection,
  ClinicalValue,
  ReportSections,
} from "@clinic/types";
import { visitError } from "./visit-errors";
export function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
const text = (value: unknown, max = 120): value is string =>
  typeof value === "string" && !!value.trim() && value.length <= max;
const id = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[a-zA-Z0-9_-]{1,80}$/.test(value) &&
  !["__proto__", "constructor", "prototype"].includes(value);
export function validateSections(
  value: unknown,
): asserts value is ClinicalSection[] {
  if (
    !Array.isArray(value) ||
    !value.length ||
    value.length > 30 ||
    JSON.stringify(value).length > 250000
  )
    visitError("clinicalTemplateInvalid");
  const ids = new Set<string>();
  const fields: Record<string, unknown>[] = [];
  for (const section of value) {
    if (
      !object(section) ||
      !id(section.id) ||
      ids.has(section.id) ||
      !text(section.title) ||
      (section.titleAr !== undefined &&
        (typeof section.titleAr !== "string" ||
          section.titleAr.length > 120)) ||
      !Array.isArray(section.fields) ||
      !section.fields.length ||
      section.fields.length > 100
    )
      visitError("clinicalTemplateInvalid");
    if (
      Object.keys(section).some(
        (key) => !["id", "title", "titleAr", "fields"].includes(key),
      )
    )
      visitError("clinicalTemplateInvalid");
    ids.add(section.id);
    for (const field of section.fields) {
      if (
        !object(field) ||
        !id(field.id) ||
        ids.has(field.id) ||
        !text(field.label) ||
        typeof field.required !== "boolean" ||
        ![
          "text",
          "textarea",
          "number",
          "radio",
          "checkboxes",
          "select",
          "multi_select",
          "boolean",
          "date",
          "measurement",
        ].includes(String(field.type))
      )
        visitError("clinicalTemplateInvalid");
      if (
        Object.keys(field).some(
          (key) =>
            ![
              "id",
              "label",
              "labelAr",
              "type",
              "required",
              "options",
              "min",
              "max",
              "unit",
              "visibility",
            ].includes(key),
        )
      )
        visitError("clinicalTemplateInvalid");
      if (
        field.labelAr !== undefined &&
        (typeof field.labelAr !== "string" || field.labelAr.length > 120)
      )
        visitError("clinicalTemplateInvalid");
      for (const key of ["min", "max"])
        if (
          field[key] !== undefined &&
          (typeof field[key] !== "number" || !Number.isFinite(field[key]))
        )
          visitError("clinicalTemplateInvalid");
      if (
        typeof field.min === "number" &&
        typeof field.max === "number" &&
        field.min > field.max
      )
        visitError("clinicalTemplateInvalid");
      if (field.type === "measurement" && !text(field.unit, 30))
        visitError("clinicalTemplateInvalid");
      if (["select", "multi_select", "radio", "checkboxes"].includes(String(field.type))) {
        if (
          !Array.isArray(field.options) ||
          !field.options.length ||
          field.options.length > 100
        )
          visitError("clinicalTemplateInvalid");
        const values = new Set();
        for (const option of field.options) {
          if (
            !object(option) ||
            !id(option.value) ||
            values.has(option.value) ||
            !text(option.label) ||
            (option.labelAr !== undefined &&
              (typeof option.labelAr !== "string" ||
                option.labelAr.length > 120)) ||
            Object.keys(option).some(
              (key) => !["value", "label", "labelAr"].includes(key),
            )
          )
            visitError("clinicalTemplateInvalid");
          values.add(option.value);
        }
      } else if (field.options !== undefined)
        visitError("clinicalTemplateInvalid");
      fields.push(field);
      ids.add(field.id);
    }
  }
  if (fields.length > 300) visitError("clinicalTemplateInvalid");
  for (const field of fields)
    if (field.visibility !== undefined) {
      const rule = field.visibility;
      if (
        !object(rule) ||
        !["equals", "not_equals"].includes(String(rule.operator)) ||
        !["string", "number", "boolean"].includes(typeof rule.value) ||
        Object.keys(rule).some(
          (key) => !["fieldId", "operator", "value"].includes(key),
        )
      )
        visitError("clinicalTemplateInvalid");
      const dependency = fields.find((item) => item.id === rule.fieldId);
      if (
        !dependency ||
        dependency.id === field.id ||
        dependency.visibility !== undefined ||
        ["measurement", "multi_select", "checkboxes"].includes(String(dependency.type))
      )
        visitError("clinicalTemplateInvalid");
    }
}
export function validateValues(
  sections: ClinicalSection[],
  values: unknown,
  signing = false,
): asserts values is Record<string, ClinicalValue> {
  if (!object(values) || JSON.stringify(values).length > 250_000)
    visitError("clinicalValuesInvalid");
  const fields = sections.flatMap((section) => section.fields);
  if (
    Object.keys(values).some((key) => !fields.some((field) => field.id === key))
  )
    visitError("clinicalValuesInvalid");
  for (const field of fields) {
    const value = values[field.id];
    const rule = field.visibility;
    const visible =
      !rule ||
      (rule.operator === "equals"
        ? values[rule.fieldId] === rule.value
        : values[rule.fieldId] !== rule.value);
    const missing =
      value === undefined ||
      value === null ||
      (typeof value === "string" && !value.trim()) ||
      (Array.isArray(value) && !value.length);
    if (missing) {
      if (signing && visible && field.required)
        visitError("clinicalRequiredFieldMissing");
      continue;
    }
    const choices = field.options?.map((option) => option.value) ?? [];
    let valid = false;
    switch (field.type) {
      case "text":
      case "textarea":
        valid = typeof value === "string" && value.length <= 20000;
        break;
      case "boolean":
        valid = typeof value === "boolean";
        break;
      case "number":
        valid =
          typeof value === "number" &&
          Number.isFinite(value) &&
          (field.min === undefined || value >= field.min) &&
          (field.max === undefined || value <= field.max);
        break;
      case "measurement":
        valid =
          object(value) &&
          Object.keys(value).every((key) => ["value", "unit"].includes(key)) &&
          typeof value.value === "number" &&
          Number.isFinite(value.value) &&
          value.unit === field.unit &&
          (field.min === undefined || value.value >= field.min) &&
          (field.max === undefined || value.value <= field.max);
        break;
      case "radio":
      case "select":
        valid = typeof value === "string" && choices.includes(value);
        break;
      case "checkboxes":
      case "multi_select":
        valid =
          Array.isArray(value) &&
          value.length <= choices.length &&
          new Set(value).size === value.length &&
          value.every(
            (item) => typeof item === "string" && choices.includes(item),
          );
        break;
      case "date":
        valid =
          typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(value) &&
          !Number.isNaN(Date.parse(value)) &&
          new Date(value).toISOString().startsWith(value);
        break;
    }
    if (!valid) visitError("clinicalValuesInvalid");
  }
}
export const blankReport = (): ReportSections => ({
  reason: "",
  summary: "",
  assessment: "",
  plan: "",
  followUp: "",
});
