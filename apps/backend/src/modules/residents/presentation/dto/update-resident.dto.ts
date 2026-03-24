import type { ResidentUpdateInput } from '@gentrix/shared-types';

import { CreateResidentDto } from './create-resident.dto';

export class UpdateResidentDto
  extends CreateResidentDto
  implements ResidentUpdateInput {}
