import { Controller, Get, Query, Req } from '@nestjs/common';
import { RouterService } from './router.service.js';
import { RouterDto } from './dto/RouterDto.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';

@Controller('router')
export class RouterController {
  constructor(
    private routerService: RouterService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get()
  generateExtrinsics(@Query() queryParams: RouterDto, @Req() req) {
    const { from, exchange, to, currencyFrom, currencyTo, slippagePct } =
      queryParams;
    this.analyticsService.track(EventName.GENERATE_ROUTER_EXTRINSICS, req, {
      from,
      exchange,
      to,
      currencyFrom,
      currencyTo,
      slippagePct,
    });
    return this.routerService.generateExtrinsics(queryParams);
  }
}
