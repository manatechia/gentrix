import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  Matches,
} from 'class-validator';

import type { MembershipHourlyRateCreateInput } from '@gentrix/shared-types';

const decimalPattern = /^\d+(\.\d{1,2})?$/;
const supportedCurrencies = ['ARS'] as const;

export class CreateHourlyRateDto implements MembershipHourlyRateCreateInput {
  @ApiProperty({ example: '15000.00' })
  @Matches(decimalPattern, {
    message: 'La tarifa debe ser un decimal positivo con hasta 2 decimales.',
  })
  rate!: string;

  @ApiProperty({ example: 'ARS' })
  @IsIn(supportedCurrencies, {
    message: `La moneda debe ser una de: ${supportedCurrencies.join(', ')}.`,
  })
  currency!: string;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  effectiveFrom!: string;
}
