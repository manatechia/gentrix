import { IsIn, IsNotEmpty, IsString } from 'class-validator';

import type {
  ResidentObservationEntryCreatableType,
  ResidentObservationEntryCreateInput,
} from '@gentrix/shared-types';

const residentObservationEntryTypes: ResidentObservationEntryCreatableType[] = [
  'follow-up',
  'action',
];

export class CreateResidentObservationEntryDto
  implements ResidentObservationEntryCreateInput
{
  @IsIn(residentObservationEntryTypes)
  entryType!: ResidentObservationEntryCreateInput['entryType'];

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}
