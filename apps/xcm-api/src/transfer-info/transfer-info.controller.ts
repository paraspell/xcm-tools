import { Controller, Request, Req, UsePipes, Post, Body } from '@nestjs/common';
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

  private trackAnalytics(
    eventName: EventName,
    req: Request,
    params: TransferInfoDto,
  ) {
    const { origin, destination, currency, amount } = params;
    this.analyticsService.track(eventName, req, {
      origin,
      destination,
      currency: JSON.stringify(currency),
      amount,
    });
  }

  @Post()
  @UsePipes(new ZodValidationPipe(TransferInfoSchema))
  async getTransferInfo(@Body() params: TransferInfoDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GET_TRANSFER_INFO, req, params);
    return await this.transferInfoService.getTransferInfo(params);
  }
}
