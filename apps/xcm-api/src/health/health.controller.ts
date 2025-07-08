import { Controller, Get } from '@nestjs/common';

import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  checkApp() {
    return { status: 'ok' };
  }

  @Get('db')
  async checkDb() {
    return this.healthService.checkDb();
  }
}
