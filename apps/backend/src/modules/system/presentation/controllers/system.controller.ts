import { Controller, Get, Inject, Req } from '@nestjs/common';

import { Public } from '../../../../common/auth/public.decorator';
import type { RequestWithSession } from '../../../../common/auth/session.guard';
import { SystemService } from '../../application/system.service';

@Controller()
export class SystemController {
  constructor(
    @Inject(SystemService)
    private readonly systemService: SystemService,
  ) {}

  @Public()
  @Get()
  getRootIndex() {
    return this.systemService.getServiceIndex();
  }

  @Public()
  @Get('api')
  getApiIndex() {
    return this.systemService.getServiceIndex();
  }

  @Public()
  @Get('health')
  getRootHealth() {
    return this.systemService.getHealthCheck();
  }

  @Public()
  @Get('api/health')
  getApiHealth() {
    return this.systemService.getHealthCheck();
  }

  @Get('snapshot')
  getRootDashboard(@Req() request: RequestWithSession) {
    return this.systemService.getDashboardSnapshot(
      request.authSession!.activeOrganization.id,
    );
  }

  @Get('handoff')
  getRootHandoff(@Req() request: RequestWithSession) {
    return this.systemService.getHandoffSnapshot(
      request.authSession!.activeOrganization.id,
    );
  }

  @Get('api/dashboard')
  getApiDashboard(@Req() request: RequestWithSession) {
    return this.systemService.getDashboardSnapshot(
      request.authSession!.activeOrganization.id,
    );
  }

  @Get('api/handoff')
  getApiHandoff(@Req() request: RequestWithSession) {
    return this.systemService.getHandoffSnapshot(
      request.authSession!.activeOrganization.id,
    );
  }
}
