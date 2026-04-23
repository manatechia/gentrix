import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

import type { WorkedHourEntryCreateInput } from '@gentrix/shared-types';

const hoursPattern = /^\d{1,2}(\.\d{1,2})?$/;

export class CreateWorkedHourEntryDto implements WorkedHourEntryCreateInput {
  @ApiProperty({ example: '2026-04-06' })
  @IsDateString()
  workDate!: string;

  @ApiProperty({ example: '4.00' })
  @Matches(hoursPattern, {
    message: 'Las horas deben ser un decimal positivo con hasta 2 decimales.',
  })
  hours!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
