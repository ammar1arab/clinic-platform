import { PartialType } from '@nestjs/mapped-types';
import { CreatePatientDto } from './create-patient.dto';
import type { UpdatePatientInput } from '@clinic/types';

export class UpdatePatientDto extends PartialType(CreatePatientDto) implements UpdatePatientInput {}
