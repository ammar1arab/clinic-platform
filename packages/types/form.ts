export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multi_select"
  | "boolean"
  | "date"
  | "measurement";
export const FORM_FIELD_TYPE = {
  TEXT: "text",
  TEXTAREA: "textarea",
  NUMBER: "number",
  SELECT: "select",
  MULTI_SELECT: "multi_select",
  BOOLEAN: "boolean",
  DATE: "date",
  MEASUREMENT: "measurement",
} as const satisfies Record<string, FormFieldType>;
export type FormValue =
  | string
  | number
  | boolean
  | string[]
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
export type TemplateStatus = "draft" | "published" | "archived";
export const TEMPLATE_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
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
  revision: number;
  version: number;
  publishedVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface FormTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  snapshot: FormTemplateInput;
  createdAt: string;
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
export type TemplateVersionDTO = FormTemplateVersion;
export const CLINICAL_FIELD_TYPE = FORM_FIELD_TYPE;
