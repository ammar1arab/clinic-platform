import { Module } from "@nestjs/common";
import { PatientPackagesController } from "./patient-packages.controller";
import { PatientPackagesService } from "./patient-packages.service";
import { PatientPackagesRepository } from "./patient-packages.repository";

@Module({
  controllers: [PatientPackagesController],
  providers: [PatientPackagesService, PatientPackagesRepository],
  exports: [PatientPackagesService],
})
export class PatientPackagesModule {}
