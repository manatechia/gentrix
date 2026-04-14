import { IsIn, IsNotEmpty, IsString } from 'class-validator';

import type {
  ResidentObservationResolutionType,
  ResidentObservationResolveInput,
} from '@gentrix/shared-types';

const residentObservationResolutionTypes: ResidentObservationResolutionType[] =
  ['completed', 'phone-call', 'medical-visit'];

export class ResolveResidentObservationDto
  implements ResidentObservationResolveInput
{
  @IsIn(residentObservationResolutionTypes)
  resolutionType!: ResidentObservationResolveInput['resolutionType'];

  @IsString()
  @IsNotEmpty()
  summary!: string;
}
