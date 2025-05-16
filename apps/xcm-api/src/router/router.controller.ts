import { Body, Controller, Post, Req, Request, UsePipes } from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import {
  ExchangePairsDto,
  ExchangePairsSchema,
  RouterBestAmountOutDto,
  RouterDto,
  RouterDtoSchema,
} from './dto/RouterDto.js';
import { RouterService } from './router.service.js';

@Controller('router')
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

  @Post()
  generateExtrinsics(@Body() params: RouterDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GENERATE_ROUTER_EXTRINSICS, req, params);
    return this.routerService.generateExtrinsics(params);
  }

  @Post('xcm-fees')
  @UsePipes(new ZodValidationPipe(RouterDtoSchema))
  getXcmFees(@Body() params: RouterDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GET_ROUTER_XCM_FEES, req, params);
    return this.routerService.getXcmFees(params);
  }

  @Post('best-amount-out')
  getBestAmountOut(
    @Body() params: RouterBestAmountOutDto,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.GET_BEST_AMOUNT_OUT, req, params);
    return this.routerService.getBestAmountOut(params);
  }

  @Post('pairs')
  @UsePipes(new ZodValidationPipe(ExchangePairsSchema))
  getExchangePairs(
    @Body() { exchange }: ExchangePairsDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_EXCHANGE_PAIRS, req, {
      exchange: exchange as string,
    });
    return this.routerService.getExchangePairs(exchange);
  }
}
