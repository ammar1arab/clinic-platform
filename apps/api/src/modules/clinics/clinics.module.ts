import { Module } from "@nestjs/common";
import { ClinicsController } from "./clinics.controller";
import { ClinicsService } from "./clinics.service";
import { ClinicsRepository } from "./clinics.repository";

@Module({
  controllers: [ClinicsController],
  providers: [ClinicsService, ClinicsRepository],
  exports: [ClinicsService],
})
export class ClinicsModule {}
