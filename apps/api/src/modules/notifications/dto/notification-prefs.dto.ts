import { IsBoolean, IsOptional } from "class-validator";

export class NotificationPrefsDto {
  @IsBoolean() referrals: boolean;
  @IsBoolean() documentation: boolean;
  @IsBoolean() appointments: boolean;
  @IsBoolean() queue: boolean;
  @IsOptional() @IsBoolean() scheduleRequests?: boolean;
}
