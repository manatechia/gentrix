import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

import type {
  ResidentAgendaRecurrenceType,
  ResidentAgendaSeriesCreateInput,
} from '@gentrix/shared-types';

const RECURRENCE_TYPES: readonly ResidentAgendaRecurrenceType[] = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
];

export class CreateResidentAgendaSeriesDto
  implements ResidentAgendaSeriesCreateInput
{
  @IsString()
  @IsNotEmpty({ message: 'El titulo es obligatorio.' })
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(RECURRENCE_TYPES as unknown as string[], {
    message: 'Tipo de recurrencia no valido.',
  })
  recurrenceType!: ResidentAgendaRecurrenceType;

  @ValidateIf((dto) => dto.recurrenceType === 'weekly')
  @IsArray()
  @ArrayNotEmpty({ message: 'La recurrencia semanal requiere al menos un dia.' })
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  recurrenceDaysOfWeek?: number[];

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora debe tener formato HH:mm (24h).',
  })
  timeOfDay!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}/, {
    message: 'La fecha de inicio debe tener formato YYYY-MM-DD.',
  })
  startsOn!: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}/, {
    message: 'La fecha de fin debe tener formato YYYY-MM-DD.',
  })
  endsOn?: string;
}
