import { IsDateString, IsIn, IsNotEmpty, IsString } from 'class-validator';

import type {
  ResidentEventCreatableType,
  ResidentEventCreateInput,
} from '@gentrix/shared-types';

const residentEventCreatableTypes: ResidentEventCreatableType[] = [
  'admission-note',
  'follow-up',
];

export class CreateResidentEventDto implements ResidentEventCreateInput {
  @IsIn(residentEventCreatableTypes)
  eventType!: ResidentEventCreateInput['eventType'];

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsDateString()
  occurredAt!: string;
}
