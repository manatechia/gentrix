import { Controller, Get, Inject } from '@nestjs/common';

import { Public } from '../../../../common/auth/public.decorator';
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
  getRootDashboard() {
    return this.systemService.getDashboardSnapshot();
  }

  @Get('api/dashboard')
  getApiDashboard() {
    return this.systemService.getDashboardSnapshot();
  }
}
