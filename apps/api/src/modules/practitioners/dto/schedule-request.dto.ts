import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";
import type {
  CreateScheduleRequestInput,
  ReviewScheduleRequestInput,
  ScheduleRequestKind,
} from "@clinic/types";

export class CreateScheduleRequestDto implements CreateScheduleRequestInput {
  @IsIn(["extra", "leave", "vacation"])
  kind: ScheduleRequestKind;

  @IsISO8601({ strict: true })
  @Matches(/(Z|[+-]\d{2}:\d{2})$/)
  startAt: string;

  @IsISO8601({ strict: true })
  @Matches(/(Z|[+-]\d{2}:\d{2})$/)
  endAt: string;

  @IsString()
  @MaxLength(500)
  reason: string;
}

export class ReviewScheduleRequestDto implements ReviewScheduleRequestInput {
  @IsIn(["approved", "declined", "withdrawn"])
  decision: ReviewScheduleRequestInput["decision"];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}

export class ScheduleRequestFiltersDto {
  @IsOptional()
  @IsIn(["extra", "leave", "vacation"])
  kind?: ScheduleRequestKind;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  search?: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsIn(["all", "pending", "history"])
  group: "all" | "pending" | "history" = "all";

  @IsIn(["newest", "oldest"])
  sort: "newest" | "oldest" = "newest";

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page = 1;
}
