import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

import {
  medicationFrequencies,
  medicationRoutes,
} from '@gentrix/domain-medication';
import type {
  EntityStatus,
  MedicationCreateInput,
} from '@gentrix/shared-types';

const medicationStatuses: EntityStatus[] = ['active', 'inactive', 'archived'];

export class CreateMedicationDto implements MedicationCreateInput {
  @IsUUID()
  residentId!: MedicationCreateInput['residentId'];

  @IsUUID()
  medicationCatalogId!: MedicationCreateInput['medicationCatalogId'];

  @IsString()
  @IsNotEmpty()
  dose!: string;

  @IsIn(medicationRoutes)
  route!: MedicationCreateInput['route'];

  @IsIn(medicationFrequencies)
  frequency!: MedicationCreateInput['frequency'];

  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { each: true })
  scheduleTimes!: string[];

  @IsString()
  @IsNotEmpty()
  prescribedBy!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsIn(medicationStatuses)
  status!: MedicationCreateInput['status'];
}
