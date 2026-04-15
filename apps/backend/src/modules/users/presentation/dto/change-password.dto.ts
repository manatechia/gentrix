import { IsNotEmpty, IsString } from 'class-validator';

import type { ForcedPasswordChangeInput } from '@gentrix/shared-types';

export class ChangePasswordDto implements ForcedPasswordChangeInput {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  newPassword!: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;
}
