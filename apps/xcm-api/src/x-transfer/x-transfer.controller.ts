import { Controller, Get, Query, Req } from '@nestjs/common';
import { XTransferService } from './x-transfer.service.js';
import { XTransferDto } from './dto/XTransferDto.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';

@Controller('x-transfer')
export class XTransferController {
  constructor(
    private xTransferService: XTransferService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get()
  generateXcmCall(@Query() queryParams: XTransferDto, @Req() req) {
    const { from, to, currency } = queryParams;
    this.analyticsService.track(EventName.GENERATE_XCM_CALL, req, {
      from,
      to,
      currency,
    });
    return this.xTransferService.generateXcmCall(queryParams);
  }
}
