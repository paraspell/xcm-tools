import { Body, Controller, Post, Req, UsePipes } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { XTransferEthService } from './x-transfer-eth.service.js';
import { EventName } from '../analytics/EventName.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import {
  XTransferEthDtoSchema,
  XTransferEthDto,
} from './dto/x-transfer-eth.dto.js';

@Controller('x-transfer-eth')
export class XTransferEthController {
  constructor(
    private xTransferEthService: XTransferEthService,
    private analyticsService: AnalyticsService,
  ) {}

  private trackAnalytics(
    eventName: EventName,
    req: Request,
    params: XTransferEthDto,
  ) {
    const { to, address, currency } = params;
    this.analyticsService.track(eventName, req, {
      to,
      address,
      currency: JSON.stringify(currency),
    });
  }

  @Post()
  @UsePipes(new ZodValidationPipe(XTransferEthDtoSchema))
  generateXcmCall(@Body() bodyParams: XTransferEthDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GENERATE_ETH_CALL, req, bodyParams);
    return this.xTransferEthService.generateEthCall(bodyParams);
  }
}
