import { Body, Controller, Param, Post, Req, Request } from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import { BalanceService } from './balance.service.js';
import {
  BalanceForeignDto,
  BalanceForeignDtoSchema,
} from './dto/BalanceForeignDto.js';
import {
  BalanceNativeDto,
  BalanceNativeDtoSchema,
} from './dto/BalanceNativeDto.js';
import {
  ExistentialDepositDto,
  ExistentialDepositDtoSchema,
} from './dto/ExistentialDepositDto.js';
import {
  VerifyEdOnDestDto,
  VerifyEdOnDestDtoSchema,
} from './dto/VerifyEdOnDestDto.js';

@Controller('balance')
export class BalanceController {
  constructor(
    private balanceService: BalanceService,
    private analyticsService: AnalyticsService,
  ) {}

  @Post(':node/native')
  getBalanceNative(
    @Param('node') node: string,
    @Body(new ZodValidationPipe(BalanceNativeDtoSchema))
    params: BalanceNativeDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_BALANCE_NATIVE, req, {
      node,
    });
    return this.balanceService.getBalanceNative(node, params);
  }

  @Post(':node/foreign')
  getBalanceForeign(
    @Param('node') node: string,
    @Body(new ZodValidationPipe(BalanceForeignDtoSchema))
    params: BalanceForeignDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_BALANCE_FOREIGN, req, {
      node,
    });
    return this.balanceService.getBalanceForeign(node, params);
  }

  @Post(':node/asset')
  getAssetBalance(
    @Param('node') node: string,
    @Body(new ZodValidationPipe(BalanceForeignDtoSchema))
    params: BalanceForeignDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_ASSET_BALANCE, req, {
      node,
    });
    return this.balanceService.getAssetBalance(node, params);
  }

  @Post(':node/max-foreign-transferable-amount')
  getMaxForeignTransferableAmount(
    @Param('node') node: string,
    @Body(new ZodValidationPipe(BalanceForeignDtoSchema))
    params: BalanceForeignDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(
      EventName.GET_MAX_FOREIGN_TRANSFERABLE_AMOUNT,
      req,
      {
        node,
      },
    );
    return this.balanceService.getMaxForeignTransferableAmount(node, params);
  }

  @Post(':node/max-native-transferable-amount')
  getMaxNativeTransferableAmount(
    @Param('node') node: string,
    @Body(new ZodValidationPipe(BalanceNativeDtoSchema))
    params: BalanceNativeDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(
      EventName.GET_MAX_FOREIGN_TRANSFERABLE_AMOUNT,
      req,
      {
        node,
      },
    );
    return this.balanceService.getMaxNativeTransferableAmount(node, params);
  }

  @Post(':node/transferable-amount')
  getTransferableAmount(
    @Param('node') node: string,
    @Body(new ZodValidationPipe(BalanceForeignDtoSchema))
    params: BalanceForeignDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_TRANSFERABLE_AMOUNT, req, {
      node,
    });
    return this.balanceService.getTransferableAmount(node, params);
  }

  @Post(':node/existential-deposit')
  getExistentialDeposit(
    @Param('node') node: string,
    @Body(new ZodValidationPipe(ExistentialDepositDtoSchema))
    params: ExistentialDepositDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_EXISTENTIAL_DEPOSIT, req, {
      node,
    });
    return this.balanceService.getExistentialDeposit(node, params);
  }

  @Post(':node/verify-ed-on-destination')
  verifyEdOnDestination(
    @Param('node') node: string,
    @Body(new ZodValidationPipe(VerifyEdOnDestDtoSchema))
    params: VerifyEdOnDestDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.VERIFY_ED_ON_DESTINATION, req, {
      node,
    });
    return this.balanceService.verifyEdOnDestination(node, params);
  }
}
