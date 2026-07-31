import { Module } from "@nestjs/common";
import { PatientPackagesModule } from "@/modules/patient-packages/patient-packages.module";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";
import { AppointmentsRepository } from "./appointments.repository";
import { DashboardModule } from "@/modules/dashboard/dashboard.module";
import { DiscountCodesModule } from "@/modules/discount-codes/discount-codes.module";

@Module({
  imports: [DashboardModule, DiscountCodesModule, PatientPackagesModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
