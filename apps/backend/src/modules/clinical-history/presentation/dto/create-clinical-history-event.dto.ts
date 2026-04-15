import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

  /**
   * Si es true, además de crear el evento se intenta poner al residente en
   * observación. La validación es flexible: se acepta omitir el campo, lo que
   * equivale a `false`.
   */
  @IsOptional()
  @IsBoolean({
    message: 'El campo "putUnderObservation" debe ser booleano.',
  })
  putUnderObservation?: boolean;
}
