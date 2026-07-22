import { IsString } from 'class-validator';

export class NotificationFiltersDto {
  @IsString()
  clinicId: string;

  @IsString()
  userId: string;
}
