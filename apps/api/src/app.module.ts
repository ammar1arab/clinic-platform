import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "@/prisma/prisma.module";
import { InfrastructureModule } from "@/infrastructure";
import {
  AuthModule,
  ClinicsModule,
  DepartmentsModule,
  RoomsModule,
  ServicesModule,
  PatientsModule,
  AppointmentsModule,
  DashboardModule,
  ReportsModule,
  PaymentMethodsModule,
  PackagesModule,
  PatientPackagesModule,
  DiscountCodesModule,
  ReferralsModule,
  NotificationsModule,
  PractitionersModule,
} from "@/modules";

@Module({
  imports: [
    PrismaModule,
    InfrastructureModule,
    AuthModule,
    ClinicsModule,
    DepartmentsModule,
    RoomsModule,
    ServicesModule,
    PatientsModule,
    AppointmentsModule,
    DashboardModule,
    ReportsModule,
    PaymentMethodsModule,
    PackagesModule,
    PatientPackagesModule,
    DiscountCodesModule,
    ReferralsModule,
    NotificationsModule,
    PractitionersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
