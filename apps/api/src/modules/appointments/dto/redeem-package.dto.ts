import { IsString } from "class-validator";

export class RedeemPackageDto {
  @IsString()
  patientPackageId: string;
}
