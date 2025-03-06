import { Global, Module } from '@nestjs/common';

import { AnalyticsService } from './analytics.service.js';

@Global()
@Module({
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
