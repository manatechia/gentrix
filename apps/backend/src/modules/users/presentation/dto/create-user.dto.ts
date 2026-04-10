import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

import type { UserCreateInput, UserCreateRole } from '@gentrix/shared-types';

const authRoles: UserCreateRole[] = [
  'nurse',
  'assistant',
  'health-director',
  'external',
];

export class CreateUserDto implements UserCreateInput {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsIn(authRoles)
  role!: UserCreateRole;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
