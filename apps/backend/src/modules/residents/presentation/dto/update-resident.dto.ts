import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { residentCareLevels } from '@gentrix/domain-residents';
import type {
  ResidentDocumentType,
  ResidentSex,
  ResidentUpdateInput,
} from '@gentrix/shared-types';
import { CreateResidentGeriatricAssessmentDto } from './create-resident.dto';

const residentDocumentTypes: ResidentDocumentType[] = [
  'dni',
  'pasaporte',
  'cedula',
  'libreta-civica',
  'otro',
];

const residentSexes: ResidentSex[] = ['femenino', 'masculino', 'x'];

export class UpdateResidentDto implements ResidentUpdateInput {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsOptional()
  middleNames?: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsOptional()
  otherLastNames?: string;

  @IsIn(residentDocumentTypes)
  documentType!: ResidentUpdateInput['documentType'];

  @IsString()
  @IsNotEmpty()
  documentNumber!: string;

  @IsString()
  @IsNotEmpty()
  documentIssuingCountry!: string;

  @IsString()
  @IsOptional()
  procedureNumber?: string;

  @IsString()
  @IsOptional()
  cuil?: string;

  @IsDateString()
  birthDate!: string;

  @IsDateString()
  admissionDate!: string;

  @IsIn(residentSexes)
  sex!: ResidentUpdateInput['sex'];

  @IsString()
  @IsOptional()
  maritalStatus?: string;

  @IsString()
  @IsOptional()
  nationality?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  room!: string;

  @IsIn(residentCareLevels)
  careLevel!: ResidentUpdateInput['careLevel'];

  @ValidateNested()
  @Type(() => CreateResidentGeriatricAssessmentDto)
  geriatricAssessment!: ResidentUpdateInput['geriatricAssessment'];
}
