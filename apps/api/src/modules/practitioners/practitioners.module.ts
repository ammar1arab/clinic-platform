import { Module } from "@nestjs/common";
import { PractitionersController } from "./practitioners.controller";
import { PractitionersService } from "./practitioners.service";
import { PractitionersRepository } from "./practitioners.repository";

@Module({
  controllers: [PractitionersController],
  providers: [PractitionersService, PractitionersRepository],
  exports: [PractitionersService],
})
export class PractitionersModule {}
