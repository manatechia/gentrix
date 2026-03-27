import { IsDateString, IsIn } from 'class-validator';

import { medicationExecutionResults } from '@gentrix/domain-medication';
import type { MedicationExecutionCreateInput } from '@gentrix/shared-types';

export class CreateMedicationExecutionDto
  implements MedicationExecutionCreateInput
{
  @IsDateString()
  occurredAt!: MedicationExecutionCreateInput['occurredAt'];

  @IsIn(medicationExecutionResults)
  result!: MedicationExecutionCreateInput['result'];
}
