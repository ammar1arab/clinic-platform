import { IsString, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  clinicId: string;

  @IsString()
  userId: string;

  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  payload?: Record<string, unknown>;
}
