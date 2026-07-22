import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class ReorderPaymentMethodsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  orderedIds: string[];
}
