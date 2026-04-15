import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import type { ResidentAgendaOccurrenceOverrideInput } from '@gentrix/shared-types';

export class OverrideResidentAgendaOccurrenceDto
  implements ResidentAgendaOccurrenceOverrideInput
{
  @IsString()
  @IsNotEmpty({ message: 'El titulo es obligatorio.' })
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'overrideScheduledAt debe ser ISO 8601 valido.' },
  )
  overrideScheduledAt?: string;
}
