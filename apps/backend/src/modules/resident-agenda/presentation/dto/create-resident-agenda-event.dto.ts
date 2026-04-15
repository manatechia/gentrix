import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import type { ResidentAgendaEventCreateInput } from '@gentrix/shared-types';

export class CreateResidentAgendaEventDto
  implements ResidentAgendaEventCreateInput
{
  @IsString()
  @IsNotEmpty({ message: 'El titulo del evento es obligatorio.' })
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString(
    {},
    { message: 'La fecha y hora del evento debe ser ISO 8601 valida.' },
  )
  scheduledAt!: string;
}
