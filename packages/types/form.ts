export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "radio"
  | "checkboxes"
  | "select"
  | "multi_select"
  | "boolean"
  | "date"
  | "time"
  | "scale"
  | "medications"
  | "measurement";
export const FORM_FIELD_TYPE = {
  TEXT: "text",
  TEXTAREA: "textarea",
  NUMBER: "number",
  RADIO: "radio",
  CHECKBOXES: "checkboxes",
  SELECT: "select",
  MULTI_SELECT: "multi_select",
  BOOLEAN: "boolean",
  DATE: "date",
  TIME: "time",
  SCALE: "scale",
  MEDICATIONS: "medications",
  MEASUREMENT: "measurement",
} as const satisfies Record<string, FormFieldType>;
export interface MedicationRow {
  drug: string;
  dose: string;
  frequency: string;
}
export type FormValue =
  | string
  | number
  | boolean
  | string[]
  | MedicationRow[]
  | { value: number; unit: string }
  | null;
export const VISIBILITY_OPERATOR = {
  EQUALS: "equals",
  NOT_EQUALS: "not_equals",
} as const;
export type VisibilityOperator =
  (typeof VISIBILITY_OPERATOR)[keyof typeof VISIBILITY_OPERATOR];
export interface FormField {
  id: string;
  label: string;
  labelAr?: string;
  type: FormFieldType;
  required: boolean;
  options?: { value: string; label: string; labelAr?: string }[];
  min?: number;
  max?: number;
  unit?: string;
  visibility?: {
    fieldId: string;
    operator: VisibilityOperator;
    value: string | number | boolean;
  };
}
export interface FormSection {
  id: string;
  title: string;
  titleAr?: string;
  fields: FormField[];
}
export interface FormAssignments {
  practitionerIds: string[];
  departmentIds: string[];
  serviceIds: string[];
}
export type TemplateStatus = "draft" | "published" | "scheduled" | "archived";
export const TEMPLATE_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  SCHEDULED: "scheduled",
  ARCHIVED: "archived",
} as const satisfies Record<string, TemplateStatus>;
export interface FormTemplateInput {
  name: string;
  nameAr?: string;
  availableToAll: boolean;
  assignments: FormAssignments;
  sections: FormSection[];
}
export interface FormTemplate extends FormTemplateInput {
  id: string;
  clinicId: string;
  status: TemplateStatus;
  scheduledAt?: string | null;
  revision: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export const DRAFT_SAVE_PHASE = {
  IDLE: "idle",
  SAVING: "saving",
  SAVED: "saved",
  ERROR: "error",
  CONFLICT: "conflict",
  CONFIRM_TEMPLATE: "confirm-template",
} as const;
export type DraftSavePhase =
  (typeof DRAFT_SAVE_PHASE)[keyof typeof DRAFT_SAVE_PHASE];
export type ClinicalFieldType = FormFieldType;
export type ClinicalValue = FormValue;
export type ClinicalField = FormField;
export type ClinicalSection = FormSection;
export type TemplateAssignments = FormAssignments;
export type ClinicalTemplateInput = FormTemplateInput;
export type TemplateDTO = FormTemplate;
export const CLINICAL_FIELD_TYPE = FORM_FIELD_TYPE;
