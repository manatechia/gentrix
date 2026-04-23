import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

import type { UserScheduleCreateInput } from '@gentrix/shared-types';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateUserScheduleDto implements UserScheduleCreateInput {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(7)
  weekday!: number;

  @ApiProperty({ example: '07:00' })
  @Matches(timePattern, {
    message: 'La hora de inicio debe usar formato HH:mm.',
  })
  startTime!: string;

  @ApiProperty({ example: '15:00' })
  @Matches(timePattern, {
    message: 'La hora de fin debe usar formato HH:mm.',
  })
  endTime!: string;

  @ApiPropertyOptional({ example: '2026-03-27T08:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  exceptionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverageNote?: string;
}
