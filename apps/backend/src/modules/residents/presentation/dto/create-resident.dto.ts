import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDataURI,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import {
  residentCareLevels,
  residentGeriatricAssessmentLevels,
} from '@gentrix/domain-residents';
import type {
  ResidentAttachmentInput,
  ResidentBelongings,
  ResidentClinicalProfile,
  ResidentCreateInput,
  ResidentDocumentType,
  ResidentDischargeInfo,
  ResidentFamilyContactInput,
  ResidentGeriatricAssessment,
  ResidentInsuranceInfo,
  ResidentMedicalHistoryEntryInput,
  ResidentPsychiatricCareInfo,
  ResidentSex,
  ResidentTransferInfo,
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

export class CreateResidentInsuranceDto implements ResidentInsuranceInfo {
  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  memberNumber?: string;
}

export class CreateResidentTransferDto implements ResidentTransferInfo {
  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class CreateResidentPsychiatryDto
  implements ResidentPsychiatricCareInfo
{
  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  careLocation?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class CreateResidentClinicalProfileDto
  implements ResidentClinicalProfile
{
  @IsString()
  @IsOptional()
  allergies?: string;

  @IsString()
  @IsOptional()
  emergencyCareLocation?: string;

  @IsString()
  @IsOptional()
  clinicalRecordNumber?: string;

  @IsString()
  @IsOptional()
  primaryDoctorName?: string;

  @IsString()
  @IsOptional()
  primaryDoctorOfficeAddress?: string;

  @IsString()
  @IsOptional()
  primaryDoctorOfficePhone?: string;

  @IsString()
  @IsOptional()
  pathologies?: string;

  @IsString()
  @IsOptional()
  surgeries?: string;

  @IsBoolean()
  @IsOptional()
  smokes?: boolean;

  @IsBoolean()
  @IsOptional()
  drinksAlcohol?: boolean;

  @IsNumber()
  @Min(0)
  @Max(500)
  @IsOptional()
  currentWeightKg?: number;
}

export class CreateResidentGeriatricAssessmentDto
  implements ResidentGeriatricAssessment
{
  @IsIn(residentGeriatricAssessmentLevels)
  @IsOptional()
  cognition?: ResidentGeriatricAssessment['cognition'];

  @IsIn(residentGeriatricAssessmentLevels)
  @IsOptional()
  mobility?: ResidentGeriatricAssessment['mobility'];

  @IsIn(residentGeriatricAssessmentLevels)
  @IsOptional()
  feeding?: ResidentGeriatricAssessment['feeding'];

  @IsIn(residentGeriatricAssessmentLevels)
  @IsOptional()
  skinIntegrity?: ResidentGeriatricAssessment['skinIntegrity'];

  @IsIn(residentGeriatricAssessmentLevels)
  @IsOptional()
  dependencyLevel?: ResidentGeriatricAssessment['dependencyLevel'];

  @IsIn(residentGeriatricAssessmentLevels)
  @IsOptional()
  mood?: ResidentGeriatricAssessment['mood'];

  @IsString()
  @IsOptional()
  supportEquipment?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateResidentBelongingsDto implements ResidentBelongings {
  @IsBoolean()
  glasses!: boolean;

  @IsBoolean()
  dentures!: boolean;

  @IsBoolean()
  walker!: boolean;

  @IsBoolean()
  orthopedicBed!: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateResidentFamilyContactDto
  implements ResidentFamilyContactInput
{
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  relationship!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateResidentDischargeDto implements ResidentDischargeInfo {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  reason?: string;
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
  sex!: ResidentCreateInput['sex'];

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

  @ValidateNested()
  @Type(() => CreateResidentInsuranceDto)
  insurance!: ResidentCreateInput['insurance'];

  @ValidateNested()
  @Type(() => CreateResidentTransferDto)
  transfer!: ResidentCreateInput['transfer'];

  @ValidateNested()
  @Type(() => CreateResidentPsychiatryDto)
  psychiatry!: ResidentCreateInput['psychiatry'];

  @ValidateNested()
  @Type(() => CreateResidentClinicalProfileDto)
  clinicalProfile!: ResidentCreateInput['clinicalProfile'];

  @ValidateNested()
  @Type(() => CreateResidentGeriatricAssessmentDto)
  geriatricAssessment!: ResidentCreateInput['geriatricAssessment'];

  @ValidateNested()
  @Type(() => CreateResidentBelongingsDto)
  belongings!: ResidentCreateInput['belongings'];

  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => CreateResidentFamilyContactDto)
  familyContacts!: ResidentCreateInput['familyContacts'];

  @ValidateNested()
  @Type(() => CreateResidentDischargeDto)
  discharge!: ResidentCreateInput['discharge'];
}
