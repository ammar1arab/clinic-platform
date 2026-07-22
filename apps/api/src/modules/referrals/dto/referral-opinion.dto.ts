import { IsString } from 'class-validator';

export class ReferralOpinionDto {
  @IsString()
  opinion: string;
}
