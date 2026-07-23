import { Module } from "@nestjs/common";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";
import { AppointmentsRepository } from "./appointments.repository";
import { DashboardModule } from "@/modules/dashboard/dashboard.module";
import { DiscountCodesModule } from "@/modules/discount-codes/discount-codes.module";

@Module({
  imports: [DashboardModule, DiscountCodesModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
