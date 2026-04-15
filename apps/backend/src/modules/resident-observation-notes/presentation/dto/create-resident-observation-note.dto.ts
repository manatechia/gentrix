import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import type { ResidentObservationNoteCreateInput } from '@gentrix/shared-types';

export class CreateResidentObservationNoteDto
  implements ResidentObservationNoteCreateInput
{
  @IsString()
  @IsNotEmpty({ message: 'La observacion no puede estar vacia.' })
  @MaxLength(2000, {
    message: 'La observacion no puede superar los 2000 caracteres.',
  })
  note!: string;

  @IsOptional()
  @IsBoolean()
  putUnderObservation?: boolean;
}
