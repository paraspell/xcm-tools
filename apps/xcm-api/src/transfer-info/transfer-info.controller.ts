import { Body, Controller, Post, Req, Request, UsePipes } from '@nestjs/common';
import { replaceBigInt } from 'src/utils/replaceBigInt.js';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import {
  TransferInfoDto,
  TransferInfoSchema,
} from './dto/transfer-info.dto.js';
import { TransferInfoService } from './transfer-info.service.js';

@Controller()
export class TransferInfoController {
  constructor(
    private transferInfoService: TransferInfoService,
    private analyticsService: AnalyticsService,
  ) {}

  private trackAnalytics(
    eventName: EventName,
    req: Request,
    params: TransferInfoDto,
  ) {
    const { origin, destination, currency } = params;
    this.analyticsService.track(eventName, req, {
      origin,
      destination,
      currency: JSON.stringify(currency, replaceBigInt),
    });
  }

  @Post('transfer-info')
  @UsePipes(new ZodValidationPipe(TransferInfoSchema))
  async getTransferInfo(@Body() params: TransferInfoDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GET_TRANSFER_INFO, req, params);
    return this.transferInfoService.getTransferInfo(params);
  }
}
