import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  Matches,
} from 'class-validator';

import type { MembershipHourlyRateUpdateInput } from '@gentrix/shared-types';

const decimalPattern = /^\d+(\.\d{1,2})?$/;
const supportedCurrencies = ['ARS'] as const;

export class UpdateHourlyRateDto implements MembershipHourlyRateUpdateInput {
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(decimalPattern, {
    message: 'La tarifa debe ser un decimal positivo con hasta 2 decimales.',
  })
  rate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(supportedCurrencies, {
    message: `La moneda debe ser una de: ${supportedCurrencies.join(', ')}.`,
  })
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}
