import { Controller, Get, Inject } from '@nestjs/common';

import { StaffService } from '../../application/staff.service';

@Controller('api/staff')
export class StaffController {
  constructor(
    @Inject(StaffService)
    private readonly staffService: StaffService,
  ) {}

  @Get()
  getStaff() {
    return this.staffService.getStaff();
  }
}
