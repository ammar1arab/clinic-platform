import type { AppointmentStatus } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import {
  APPOINTMENT_STATUS,
  INVOICE_STATUS,
  NOTE_STATUS,
  PRESENCE_SOURCE,
  VISIT_QUEUE,
  VISIT_REPORT_STATUS,
  type ClinicalSection,
  type ClinicalValue,
  type ReportSections,
} from "@clinic/types";
const optional = (_object: unknown, value: unknown) => value !== undefined;
export class RevisionDto {
  @IsInt() @Min(0) expectedRevision: number;
}
export class SignDto {
  @IsInt() @Min(0) revision: number;
}
export class ReasonDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason: string;
}
export class StartVisitDto {
  @ValidateIf(optional) @IsInt() @Min(0) expectedAppointmentRevision?: number;
}
export class PresenceDto {
  @IsIn(Object.values(PRESENCE_SOURCE))
  source: (typeof PRESENCE_SOURCE)[keyof typeof PRESENCE_SOURCE];
}
export class NoteDraftDto extends SignDto {
  @IsUUID() templateVersionId: string;
  @IsObject() values: Record<string, ClinicalValue>;
  @ValidateIf(optional) @IsBoolean() acknowledgeTemplateChange?: boolean;
}
export class ReportSectionsDto implements ReportSections {
  @IsString() @MaxLength(10000) reason: string;
  @IsString() @MaxLength(20000) summary: string;
  @IsString() @MaxLength(20000) assessment: string;
  @IsString() @MaxLength(20000) plan: string;
  @IsString() @MaxLength(10000) followUp: string;
}
export class ReportDraftDto extends SignDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ReportSectionsDto)
  sections: ReportSectionsDto;
}
export class ReportAmendDto extends ReportDraftDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason: string;
}
export class FeedbackDto {
  @IsString() @MinLength(3) @MaxLength(2000) message: string;
}
export class AddendumDto extends ReasonDto {
  @IsString() @MinLength(1) @MaxLength(20000) text: string;
}
export class AssignmentsDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID("all", { each: true })
  practitionerIds: string[];
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID("all", { each: true })
  departmentIds: string[];
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID("all", { each: true })
  serviceIds: string[];
}
export class TemplateDto {
  @IsString() @MinLength(1) @MaxLength(120) name: string;
  @ValidateIf(optional) @IsString() @MaxLength(120) nameAr?: string;
  @IsBoolean() availableToAll: boolean;
  @IsObject()
  @ValidateNested()
  @Type(() => AssignmentsDto)
  assignments: AssignmentsDto;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) sections: ClinicalSection[];
}
export class UpdateTemplateDto extends TemplateDto {
  @IsInt() @Min(0) revision: number;
}
export class NotePreferenceDto {
  @ValidateIf((_object: unknown, value: unknown) => value !== null)
  @IsUUID()
  templateId: string | null;
}
export class InvoiceLineDto {
  @IsString() @MinLength(1) @MaxLength(80) id: string;
  @IsString() @MinLength(1) @MaxLength(500) description: string;
  @Matches(/^\d{1,6}(\.\d{1,3})?$/) quantity: string;
  @Matches(/^\d{1,9}(\.\d{1,3})?$/) unitPrice: string;
}
export class InvoiceDraftDto extends SignDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lineItems: InvoiceLineDto[];
  @ValidateIf(optional) @Matches(/^\d{1,9}(\.\d{1,3})?$/) discount?: string;
  @ValidateIf(optional) @Matches(/^\d{1,9}(\.\d{1,3})?$/) tax?: string;
}
export class PaymentDto extends RevisionDto {
  @Matches(/^\d{1,9}(\.\d{1,3})?$/) amount: string;
  @IsUUID() methodId: string;
  @IsUUID() requestId: string;
  @ValidateIf(optional) @IsString() @MaxLength(200) reference?: string;
  @ValidateIf(optional) @IsString() @MaxLength(1000) reason?: string;
}
export class ReversalDto extends RevisionDto {
  @Matches(/^\d{1,9}(\.\d{1,3})?$/) amount: string;
  @IsUUID() paymentId: string;
  @IsUUID() requestId: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason: string;
}
export class VisitFiltersDto {
  @ValidateIf(optional)
  @IsIn(Object.values(VISIT_QUEUE))
  queue?: import("@clinic/types").VisitQueue;
  @ValidateIf(optional) @IsISO8601() from?: string;
  @ValidateIf(optional) @IsISO8601() to?: string;
  @ValidateIf(optional) @IsUUID() practitionerId?: string;
  @ValidateIf(optional)
  @IsIn(Object.values(APPOINTMENT_STATUS))
  appointmentStatus?: AppointmentStatus;
  @ValidateIf(optional)
  @IsIn(Object.values(NOTE_STATUS))
  noteStatus?: string;
  @ValidateIf(optional)
  @IsIn(Object.values(VISIT_REPORT_STATUS))
  reportStatus?: string;
  @ValidateIf(optional)
  @IsIn(Object.values(INVOICE_STATUS))
  invoiceStatus?: string;
  @ValidateIf(optional) @IsString() @MaxLength(120) search?: string;
  @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number = 20;
}

export class VoidInvoiceDto extends ReasonDto {
  @IsInt() @Min(0) revision: number;
}
export class DocumentQueryDto {
  @ValidateIf(optional) @Type(() => Number) @IsInt() @Min(1) revision?: number;
}
export class ReleaseDocumentDto extends ReasonDto {
  @IsBoolean() released: boolean;
}

export class AvailableTemplatesDto {
  @ValidateIf(optional) @IsUUID() appointmentId?: string;
}

export class VisitHistoryQueryDto {
  @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number = 20;
}

export class InvoiceCorrectionDto extends InvoiceDraftDto {
  @IsString() @MinLength(3) @MaxLength(1000) reason: string;
}
