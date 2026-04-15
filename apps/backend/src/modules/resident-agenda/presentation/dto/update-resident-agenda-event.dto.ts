import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import type { ResidentAgendaEventUpdateInput } from '@gentrix/shared-types';

export class UpdateResidentAgendaEventDto
  implements ResidentAgendaEventUpdateInput
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
