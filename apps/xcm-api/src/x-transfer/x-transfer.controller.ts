import {
  Body,
  Controller,
  Request,
  Get,
  Post,
  Query,
  Req,
  UsePipes,
} from '@nestjs/common';
import { XTransferService } from './x-transfer.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import { XTransferDto, XTransferDtoSchema } from './dto/XTransferDto.js';
import {
  BatchXTransferDto,
  BatchXTransferDtoSchema,
} from './dto/XTransferBatchDto.js';

@Controller()
export class XTransferController {
  constructor(
    private xTransferService: XTransferService,
    private analyticsService: AnalyticsService,
  ) {}

  private trackAnalytics(
    eventName: EventName,
    req: Request,
    params: XTransferDto,
  ) {
    const { from, to, currency } = params;
    const resolvedCurrency = JSON.stringify(currency);
    const resolvedTo = JSON.stringify(to);
    this.analyticsService.track(eventName, req, {
      from: from ?? 'unknown',
      resolvedTo,
      resolvedCurrency,
    });
  }

  private trackAnalyticsBatch(
    eventName: EventName,
    req: Request,
    params: BatchXTransferDto,
  ) {
    const { transfers, options } = params;
    const resolvedTransfers = JSON.stringify(transfers);
    const resolvedOptions = JSON.stringify(options);
    this.analyticsService.track(eventName, req, {
      resolvedTransfers,
      resolvedOptions,
    });
  }

  @Get('x-transfer')
  @UsePipes(new ZodValidationPipe(XTransferDtoSchema))
  generateXcmCall(@Query() queryParams: XTransferDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GENERATE_XCM_CALL, req, queryParams);
    return this.xTransferService.generateXcmCall(queryParams);
  }

  @Post('x-transfer')
  @UsePipes(new ZodValidationPipe(XTransferDtoSchema))
  generateXcmCallV2(@Body() bodyParams: XTransferDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GENERATE_XCM_CALL, req, bodyParams);
    return this.xTransferService.generateXcmCall(bodyParams);
  }

  @Post('x-transfer-hash')
  @UsePipes(new ZodValidationPipe(XTransferDtoSchema))
  generateXcmCallV2Hash(@Body() bodyParams: XTransferDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GENERATE_XCM_CALL_HASH, req, bodyParams);
    return this.xTransferService.generateXcmCall(bodyParams, true);
  }

  @Post('x-transfer-batch')
  @UsePipes(new ZodValidationPipe(BatchXTransferDtoSchema))
  generateXcmCallBatchHash(
    @Body() bodyParams: BatchXTransferDto,
    @Req() req: Request,
  ) {
    this.trackAnalyticsBatch(
      EventName.GENERATE_XCM_CALL_BATCH_HASH,
      req,
      bodyParams,
    );
    return this.xTransferService.generateBatchXcmCall(bodyParams);
  }
}
