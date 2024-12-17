import { Body, Controller, Request, Post, Req, UsePipes } from '@nestjs/common';
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

  @Post('dry-run')
  @UsePipes(new ZodValidationPipe(XTransferDtoSchema))
  dryRun(@Body() bodyParams: XTransferDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GENERATE_XCM_CALL, req, bodyParams);
    return this.xTransferService.generateXcmCall(bodyParams, false, true);
  }

  @Post('x-transfer')
  @UsePipes(new ZodValidationPipe(XTransferDtoSchema))
  generateXcmCall(@Body() bodyParams: XTransferDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GENERATE_XCM_CALL, req, bodyParams);
    return this.xTransferService.generateXcmCall(bodyParams);
  }

  @Post('x-transfer-papi')
  @UsePipes(new ZodValidationPipe(XTransferDtoSchema))
  generateXcmCallPapi(@Body() bodyParams: XTransferDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GENERATE_XCM_CALL, req, bodyParams);
    return this.xTransferService.generateXcmCall(bodyParams, true);
  }

  @Post('x-transfer-batch')
  @UsePipes(new ZodValidationPipe(BatchXTransferDtoSchema))
  generateXcmCallBatch(
    @Body() bodyParams: BatchXTransferDto,
    @Req() req: Request,
  ) {
    this.trackAnalyticsBatch(
      EventName.GENERATE_XCM_CALL_BATCH,
      req,
      bodyParams,
    );
    return this.xTransferService.generateBatchXcmCall(bodyParams);
  }

  @Post('x-transfer-batch-papi')
  @UsePipes(new ZodValidationPipe(BatchXTransferDtoSchema))
  generateXcmCallBatchPapi(
    @Body() bodyParams: BatchXTransferDto,
    @Req() req: Request,
  ) {
    this.trackAnalyticsBatch(
      EventName.GENERATE_XCM_CALL_BATCH_PAPI,
      req,
      bodyParams,
    );
    return this.xTransferService.generateBatchXcmCall(bodyParams, true);
  }
}
