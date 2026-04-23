import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

import type {
  HourSettlementIssueInput,
  HourSettlementPeriodInput,
} from '@gentrix/shared-types';

export class SettlementPeriodDto implements HourSettlementPeriodInput {
  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  periodStart!: string;

  @ApiProperty({ example: '2026-04-15' })
  @IsDateString()
  periodEnd!: string;
}

export class SettlementIssueDto
  extends SettlementPeriodDto
  implements HourSettlementIssueInput
{
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
