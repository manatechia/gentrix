import { IsIn } from 'class-validator';

import {
  RESIDENT_CARE_STATUSES,
  type ResidentCareStatus,
  type ResidentCareStatusUpdateInput,
} from '@gentrix/shared-types';

const careStatusValues = [...RESIDENT_CARE_STATUSES] as ResidentCareStatus[];

export class UpdateResidentCareStatusDto
  implements ResidentCareStatusUpdateInput
{
  @IsIn(careStatusValues, {
    message: 'El estado clinico solicitado no es valido.',
  })
  toStatus!: ResidentCareStatus;
}
