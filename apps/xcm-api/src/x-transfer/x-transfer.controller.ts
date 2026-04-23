import {
  Body,
  Controller,
  Get,
  Post,
  Query,
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
  ExchangePairsDto,
  ExchangePairsSchema,
  GetXcmFeeDto,
  GetXcmFeeSchema,
  SignAndSubmitDto,
  SignAndSubmitSchema,
  XTransferDto,
  XTransferDtoSchema,
  XTransferDtoWSender,
  XTransferDtoWSenderSchema,
} from './dto/XTransferDto.js';
import { XTransferService } from './x-transfer.service.js';

@Controller()
export class XTransferController {
  constructor(
    private service: XTransferService,
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
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderSchema))
  dryRun(@Body() params: XTransferDtoWSender, @Req() req: Request) {
    this.trackAnalytics(EventName.DRY_RUN, req, params);
    return this.service.dryRun(params);
  }

  @Post('dry-run-preview')
  @UsePipes(new ZodValidationPipe(DryRunPreviewSchema))
  dryRunPreview(@Body() params: DryRunPreviewDto, @Req() req: Request) {
    this.trackAnalytics(EventName.DRY_RUN_PREVIEW, req, params);
    return this.service.dryRunPreview(params);
  }

  @Post('xcm-fee')
  @UsePipes(new ZodValidationPipe(GetXcmFeeSchema))
  getXcmFee(@Body() params: GetXcmFeeDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GET_XCM_FEE, req, params);
    return this.service.getXcmFee(params);
  }

  @Post('origin-xcm-fee')
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderSchema))
  getOriginXcmFee(@Body() params: XTransferDtoWSender, @Req() req: Request) {
    this.trackAnalytics(EventName.GET_ORIGIN_XCM_FEE, req, params);
    return this.service.getOriginXcmFee(params);
  }

  @Post('x-transfer')
  @UsePipes(new ZodValidationPipe(XTransferDtoSchema))
  generateXcmCall(@Body() bodyParams: XTransferDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GENERATE_XCM_CALL, req, bodyParams);
    return this.service.generateXcmCall(bodyParams);
  }

  @Post('x-transfers')
  @UsePipes(new ZodValidationPipe(XTransferDtoSchema))
  generateXcmCalls(@Body() bodyParams: XTransferDto, @Req() req: Request) {
    this.trackAnalytics(EventName.GENERATE_XCM_CALLS, req, bodyParams);
    return this.service.generateXcmCalls(bodyParams);
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
    return this.service.generateBatchXcmCall(bodyParams);
  }

  @Post('sign-and-submit')
  @UsePipes(new ZodValidationPipe(SignAndSubmitSchema))
  signAndSubmit(@Body() params: SignAndSubmitDto, @Req() req: Request) {
    this.trackAnalytics(EventName.SIGN_AND_SUBMIT, req, params);
    return this.service.signAndSubmit(params);
  }

  @Get('x-transfer/eth-bridge-status')
  getBridgeStatus() {
    return this.service.getBridgeStatus();
  }

  @Post('transferable-amount')
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderSchema))
  getTransferableAmount(
    @Body() bodyParams: XTransferDtoWSender,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.GET_TRANSFERABLE_AMOUNT, req, bodyParams);
    return this.service.getTransferableAmount(bodyParams);
  }

  @Post('min-transferable-amount')
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderSchema))
  getMinTransferableAmount(
    @Body() bodyParams: XTransferDtoWSender,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.GET_MIN_TRANSFERABLE_AMOUNT, req, bodyParams);
    return this.service.getMinTransferableAmount(bodyParams);
  }

  @Post('verify-ed-on-destination')
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderSchema))
  verifyEdOnDestination(
    @Body() bodyParams: XTransferDtoWSender,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.VERIFY_ED_ON_DESTINATION, req, bodyParams);
    return this.service.verifyEdOnDestination(bodyParams);
  }

  @Post('transfer-info')
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderSchema))
  getTransferInfo(
    @Body() bodyParams: XTransferDtoWSender,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.GET_TRANSFER_INFO, req, bodyParams);
    return this.service.getTransferInfo(bodyParams);
  }

  @Post('receivable-amount')
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderSchema))
  getReceivableAmount(
    @Body() bodyParams: XTransferDtoWSender,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.GET_RECEIVABLE_AMOUNT, req, bodyParams);
    return this.service.getReceivableAmount(bodyParams);
  }

  @Post('best-amount-out')
  @UsePipes(new ZodValidationPipe(XTransferDtoWSenderSchema))
  getBestAmountOut(
    @Body() bodyParams: XTransferDtoWSender,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.GET_BEST_AMOUNT_OUT, req, bodyParams);
    return this.service.getBestAmountOut(bodyParams);
  }

  @Get('x-transfer/para-eth-fees')
  getParaEthFees() {
    return this.service.getParaEthFees();
  }

  @Get('swap/pairs')
  @UsePipes(new ZodValidationPipe(ExchangePairsSchema))
  getExchangePairs(
    @Query() { exchange }: ExchangePairsDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_EXCHANGE_PAIRS, req, {
      exchange: exchange as string,
    });
    return this.service.getExchangePairs(exchange);
  }
}
