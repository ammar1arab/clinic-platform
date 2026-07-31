import { Module } from "@nestjs/common";
import { PatientsController } from "./patients.controller";
import { PatientsService } from "./patients.service";
import { PatientsRepository } from "./patients.repository";
import { PatientPackagesModule } from "@/modules/patient-packages/patient-packages.module";

@Module({
  imports: [PatientPackagesModule],
  controllers: [PatientsController],
  providers: [PatientsService, PatientsRepository],
  exports: [PatientsService],
})
export class PatientsModule {}
