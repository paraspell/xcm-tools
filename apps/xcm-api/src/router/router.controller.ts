import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Request,
} from '@nestjs/common';
import { RouterService } from './router.service.js';
import { RouterDto } from './dto/RouterDto.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';

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
      exchange,
      to,
      currencyFrom,
      currencyTo,
      slippagePct,
    });
  }

  @Get('router')
  generateExtrinsics(@Query() queryParams: RouterDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GENERATE_ROUTER_EXTRINSICS, req, queryParams);
    return this.routerService.generateExtrinsics(queryParams);
  }

  @Post('router')
  generateExtrinsicsV2(@Body() queryParams: RouterDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GENERATE_ROUTER_EXTRINSICS, req, queryParams);
    return this.routerService.generateExtrinsics(queryParams);
  }

  @Post('router-hash')
  generateExtrinsicsV2Hash(
    @Body() queryParams: RouterDto,
    @Req() req: Request,
  ) {
    this.trackAnalytics(
      EventName.GENERATE_ROUTER_EXTRINSICS_HASH,
      req,
      queryParams,
    );
    return this.routerService.generateExtrinsics(queryParams, true);
  }
}
