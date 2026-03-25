import { Controller, Get, Inject, Req } from '@nestjs/common';

import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { StaffService } from '../../application/staff.service';

@Controller('api/staff')
export class StaffController {
  constructor(
    @Inject(StaffService)
    private readonly staffService: StaffService,
  ) {}

  @Get()
  getStaff(@Req() request: RequestWithSession) {
    return this.staffService.getStaff(
      request.authSession!.activeOrganization.id,
    );
  }
}
