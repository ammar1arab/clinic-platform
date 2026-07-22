import { Module } from '@nestjs/common';
import { DiscountCodesController } from './discount-codes.controller';
import { DiscountCodesService } from './discount-codes.service';
import { DiscountCodesRepository } from './discount-codes.repository';

@Module({
  controllers: [DiscountCodesController],
  providers: [DiscountCodesService, DiscountCodesRepository],
  exports: [DiscountCodesService],
})
export class DiscountCodesModule {}
