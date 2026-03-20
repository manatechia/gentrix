import {
  ArrayMaxSize,
  IsArray,
  IsDataURI,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { residentCareLevels } from '@gentrix/domain-residents';
import type {
  ResidentAttachmentInput,
  ResidentCreateInput,
  ResidentDocumentType,
  ResidentMedicalHistoryEntryInput,
  ResidentSex,
} from '@gentrix/shared-types';

const residentDocumentTypes: ResidentDocumentType[] = [
  'dni',
  'pasaporte',
  'cedula',
  'libreta-civica',
  'otro',
];

const residentSexes: ResidentSex[] = ['femenino', 'masculino', 'x'];

export class CreateResidentMedicalHistoryDto
  implements ResidentMedicalHistoryEntryInput
{
  @IsDateString()
  recordedAt!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  notes!: string;
}

export class CreateResidentAttachmentDto implements ResidentAttachmentInput {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(5_000_000)
  sizeBytes!: number;

  @IsDataURI()
  dataUrl!: string;
}

export class CreateResidentDto implements ResidentCreateInput {
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
  documentType!: ResidentCreateInput['documentType'];

  @IsString()
  @IsNotEmpty()
  documentNumber!: string;

  @IsString()
  @IsNotEmpty()
  documentIssuingCountry!: string;

  @IsDateString()
  birthDate!: string;

  @IsIn(residentSexes)
  sex!: ResidentCreateInput['sex'];

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  room!: string;

  @IsIn(residentCareLevels)
  careLevel!: ResidentCreateInput['careLevel'];

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CreateResidentMedicalHistoryDto)
  medicalHistory!: ResidentCreateInput['medicalHistory'];

  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => CreateResidentAttachmentDto)
  attachments!: ResidentCreateInput['attachments'];
}
