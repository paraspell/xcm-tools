import { Body, Controller, Post, Req, Request } from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { RouterDto } from './dto/RouterDto.js';
import { RouterService } from './router.service.js';

@Controller()
export class RouterController {
  constructor(
    private routerService: RouterService,
    private analyticsService: AnalyticsService,
  ) {}

  private trackAnalytics(
    eventName: EventName,
    req: Request,
    params: RouterDto,
  ) {
    const { from, exchange, to, currencyFrom, currencyTo, slippagePct } =
      params;
    this.analyticsService.track(eventName, req, {
      from,
      exchange: exchange ?? 'unknown',
      to,
      currencyFrom: JSON.stringify(currencyFrom),
      currencyTo: JSON.stringify(currencyTo),
      slippagePct: slippagePct ?? 'unknown',
    });
  }

  @Post('router')
  generateExtrinsics(@Body() queryParams: RouterDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GENERATE_ROUTER_EXTRINSICS, req, queryParams);
    return this.routerService.generateExtrinsics(queryParams);
  }
}
