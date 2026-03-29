import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

import type { ClinicalHistoryEventCreateInput } from '@gentrix/shared-types';

export class CreateClinicalHistoryEventDto
  implements ClinicalHistoryEventCreateInput
{
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsDateString()
  occurredAt!: string;
}
