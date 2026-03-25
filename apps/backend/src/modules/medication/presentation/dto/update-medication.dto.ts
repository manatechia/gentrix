import type { MedicationUpdateInput } from '@gentrix/shared-types';

import { CreateMedicationDto } from './create-medication.dto';

export class UpdateMedicationDto
  extends CreateMedicationDto
  implements MedicationUpdateInput {}
