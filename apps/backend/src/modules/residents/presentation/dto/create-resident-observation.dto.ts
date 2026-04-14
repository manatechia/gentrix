import { IsIn, IsNotEmpty, IsString } from 'class-validator';

import type {
  ResidentObservationCreateInput,
  ResidentObservationSeverity,
} from '@gentrix/shared-types';

const residentObservationSeverities: ResidentObservationSeverity[] = [
  'warning',
  'critical',
];

export class CreateResidentObservationDto
  implements ResidentObservationCreateInput
{
  @IsIn(residentObservationSeverities)
  severity!: ResidentObservationCreateInput['severity'];

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}
