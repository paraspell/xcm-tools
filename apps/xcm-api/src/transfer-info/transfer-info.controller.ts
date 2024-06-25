import { Controller, Get, Query, Req, UsePipes } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import { TransferInfoService } from './transfer-info.service.js';
import {
  TransferInfoDto,
  TransferInfoSchema,
} from './dto/transfer-info.dto.js';

@Controller('transfer-info')
export class TransferInfoController {
  constructor(
    private transferInfoService: TransferInfoService,
    private analyticsService: AnalyticsService,
  ) {}

  private trackAnalytics(eventName: EventName, req, params: TransferInfoDto) {
    const { origin, destination, currency, amount } = params;
    this.analyticsService.track(eventName, req, {
      origin,
      destination,
      currency,
      amount,
    });
  }

  @Get()
  @UsePipes(new ZodValidationPipe(TransferInfoSchema))
  getTransferInfo(@Query() queryParams: TransferInfoDto, @Req() req) {
    this.trackAnalytics(EventName.GET_TRANSFER_INFO, req, queryParams);
    return this.transferInfoService.getTransferInfo(queryParams);
  }
}
