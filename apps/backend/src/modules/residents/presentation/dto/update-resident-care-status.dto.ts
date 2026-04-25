import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import {
  RESIDENT_CARE_STATUSES,
  RESIDENT_CARE_STATUS_CLOSURE_REASONS,
  type ResidentCareStatus,
  type ResidentCareStatusClosureReason,
  type ResidentCareStatusUpdateInput,
} from '@gentrix/shared-types';

const careStatusValues = [...RESIDENT_CARE_STATUSES] as ResidentCareStatus[];
const closureReasonValues = [
  ...RESIDENT_CARE_STATUS_CLOSURE_REASONS,
] as ResidentCareStatusClosureReason[];

export class UpdateResidentCareStatusDto
  implements ResidentCareStatusUpdateInput
{
  @IsIn(careStatusValues, {
    message: 'El estado clinico solicitado no es valido.',
  })
  toStatus!: ResidentCareStatus;

  /**
   * Catálogo cerrado: estable | escalado_medico | derivado | otro. La regla
   * de negocio (cierre de observación lo exige) se valida en la capa
   * servicio: el DTO solo asegura que el valor recibido pertenezca al
   * catálogo cuando viene presente.
   */
  @IsOptional()
  @IsIn(closureReasonValues, {
    message: 'El motivo de cierre informado no es valido.',
  })
  closureReason?: ResidentCareStatusClosureReason;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'La nota no puede superar los 2000 caracteres.',
  })
  note?: string;
}
