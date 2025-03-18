import { Body, Controller, Post, Req, Request } from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { RouterBestAmountOutDto, RouterDto } from './dto/RouterDto.js';
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
    params: RouterDto | RouterBestAmountOutDto,
  ) {
    const { from, exchange, to, currencyFrom, currencyTo } = params;
    this.analyticsService.track(eventName, req, {
      from,
      exchange: exchange ? exchange.toString() : 'unknown',
      to,
      currencyFrom: JSON.stringify(currencyFrom),
      currencyTo: JSON.stringify(currencyTo),
      slippagePct:
        'slippagePct' in params && params.slippagePct
          ? params.slippagePct
          : 'unknown',
    });
  }

  @Post('router')
  generateExtrinsics(@Body() queryParams: RouterDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GENERATE_ROUTER_EXTRINSICS, req, queryParams);
    return this.routerService.generateExtrinsics(queryParams);
  }

  @Post('router/best-amount-out')
  getBestAmountOut(
    @Body() queryParams: RouterBestAmountOutDto,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.GET_BEST_AMOUNT_OUT, req, queryParams);
    return this.routerService.getBestAmountOut(queryParams);
  }
}
