import { Body, Controller, Get, Inject, Post, Req } from '@nestjs/common';

import { assertCanManageUsers } from '../../../../common/auth/role-access';
import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { UsersService } from '../../application/users.service';
import { CreateUserDto } from '../dto/create-user.dto';

@Controller('api/users')
export class UsersController {
  constructor(
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  @Get()
  getUsers(@Req() request: RequestWithSession) {
    assertCanManageUsers(request.authSession!.user.role);
    return this.usersService.getUsers(request.authSession!.activeOrganization.id);
  }

  @Post()
  createUser(
    @Body() body: CreateUserDto,
    @Req() request: RequestWithSession,
  ) {
    assertCanManageUsers(request.authSession!.user.role);
    return this.usersService.createUser(
      body,
      request.authSession!.user.email,
      request.authSession!.activeOrganization.id,
    );
  }
}
