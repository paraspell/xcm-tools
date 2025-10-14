import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Request,
  UsePipes,
} from '@nestjs/common';
import { replaceBigInt } from '@paraspell/sdk';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import {
  BatchXTransferDto,
  BatchXTransferDtoSchema,
} from './dto/XTransferBatchDto.js';
import {
  DryRunPreviewDto,
  DryRunPreviewSchema,
  GetXcmFeeDto,
  GetXcmFeeSchema,
  XTransferDto,
  XTransferDtoSchema,
  XTransferDtoWSenderAddress,
  XTransferDtoWSenderAddressSchema,
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
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderAddressSchema))
  dryRun(@Body() params: XTransferDtoWSenderAddress, @Req() req: Request) {
    this.trackAnalytics(EventName.DRY_RUN, req, params);
    return this.xTransferService.dryRun(params);
  }

  @Post('dry-run-preview')
  @UsePipes(new ZodValidationPipe(DryRunPreviewSchema))
  dryRunPreview(@Body() params: DryRunPreviewDto, @Req() req: Request) {
    this.trackAnalytics(EventName.DRY_RUN_PREVIEW, req, params);
    return this.xTransferService.dryRunPreview(params);
  }

  @Post('xcm-fee')
  @UsePipes(new ZodValidationPipe(GetXcmFeeSchema))
  getXcmFee(@Body() params: GetXcmFeeDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GET_XCM_FEE, req, params as XTransferDto);
    return this.xTransferService.getXcmFee(params);
  }

  @Post('origin-xcm-fee')
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderAddressSchema))
  getOriginXcmFee(
    @Body() params: XTransferDtoWSenderAddress,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.GET_ORIGIN_XCM_FEE, req, params);
    return this.xTransferService.getOriginXcmFee(params);
  }

  @Post('xcm-fee-estimate')
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderAddressSchema))
  getXcmFeeEstimate(
    @Body() params: XTransferDtoWSenderAddress,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.GET_XCM_FEE_ESTIMATE, req, params);
    return this.xTransferService.getXcmFeeEstimate(params);
  }

  @Post('origin-xcm-fee-estimate')
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderAddressSchema))
  getOriginXcmFeeEstimate(
    @Body() params: XTransferDtoWSenderAddress,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.GET_ORIGIN_XCM_FEE_ESTIMATE, req, params);
    return this.xTransferService.getOriginXcmFeeEstimate(params);
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

  @Post('transferable-amount')
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderAddressSchema))
  getTransferableAmount(
    @Body() bodyParams: XTransferDtoWSenderAddress,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.GET_TRANSFERABLE_AMOUNT, req, bodyParams);
    return this.xTransferService.getTransferableAmount(bodyParams);
  }

  @Post('min-transferable-amount')
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderAddressSchema))
  getMinTransferableAmount(
    @Body() bodyParams: XTransferDtoWSenderAddress,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.GET_MIN_TRANSFERABLE_AMOUNT, req, bodyParams);
    return this.xTransferService.getMinTransferableAmount(bodyParams);
  }

  @Post('verify-ed-on-destination')
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderAddressSchema))
  verifyEdOnDestination(
    @Body() bodyParams: XTransferDtoWSenderAddress,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.VERIFY_ED_ON_DESTINATION, req, bodyParams);
    return this.xTransferService.verifyEdOnDestination(bodyParams);
  }

  @Post('transfer-info')
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderAddressSchema))
  getTransferInfo(
    @Body() bodyParams: XTransferDtoWSenderAddress,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.GET_TRANSFER_INFO, req, bodyParams);
    return this.xTransferService.getTransferInfo(bodyParams);
  }

  @Post('receivable-amount')
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderAddressSchema))
  getReceivableAmount(
    @Body() bodyParams: XTransferDtoWSenderAddress,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.GET_RECEIVABLE_AMOUNT, req, bodyParams);
    return this.xTransferService.getReceivableAmount(bodyParams);
  }

  @Get('x-transfer/para-eth-fees')
  getParaEthFees() {
    return this.xTransferService.getParaEthFees();
  }
}
