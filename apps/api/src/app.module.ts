import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "@/prisma/prisma.module";
import { InfrastructureModule, I18nMiddleware } from "@/infrastructure";
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(I18nMiddleware).forRoutes("*");
  }
}
