import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Request,
  UsePipes,
} from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { replaceBigInt } from '../utils/replaceBigInt.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import {
  BatchXTransferDto,
  BatchXTransferDtoSchema,
} from './dto/XTransferBatchDto.js';
import {
  GetXcmFeeSchema,
  XTransferDto,
  XTransferDtoSchema,
} from './dto/XTransferDto.js';
import { XTransferService } from './x-transfer.service.js';

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
    const resolvedCurrency = JSON.stringify(currency, replaceBigInt);
    const resolvedTo = JSON.stringify(to, replaceBigInt);
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
  dryRun(@Body() params: XTransferDto, @Req() req: Request) {
    this.trackAnalytics(EventName.DRY_RUN_XCM_CALL, req, params);
    return this.xTransferService.dryRun(params);
  }

  @Post('xcm-fee')
  @UsePipes(new ZodValidationPipe(GetXcmFeeSchema))
  getXcmFee(@Body() params: XTransferDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GET_XCM_FEE, req, params);
    return this.xTransferService.getXcmFee(params);
  }

  @Post('xcm-fee-estimate')
  @UsePipes(new ZodValidationPipe(XTransferDtoSchema))
  getXcmFeeEstimate(@Body() params: XTransferDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GET_XCM_FEE_ESTIMATE, req, params);
    return this.xTransferService.getXcmFeeEstimate(params);
  }

  @Post('x-transfer')
  @UsePipes(new ZodValidationPipe(XTransferDtoSchema))
  generateXcmCall(@Body() bodyParams: XTransferDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GENERATE_XCM_CALL, req, bodyParams);
    return this.xTransferService.generateXcmCall(bodyParams);
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

  @Get('x-transfer/eth-bridge-status')
  getBridgeStatus() {
    return this.xTransferService.getBridgeStatus();
  }
}
