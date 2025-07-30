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

@Controller('balance')
export class BalanceController {
  constructor(
    private balanceService: BalanceService,
    private analyticsService: AnalyticsService,
  ) {}

  @Post(':chain/native')
  getBalanceNative(
    @Param('chain') chain: string,
    @Body(new ZodValidationPipe(BalanceNativeDtoSchema))
    params: BalanceNativeDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_BALANCE_NATIVE, req, {
      chain,
    });
    return this.balanceService.getBalanceNative(chain, params);
  }

  @Post(':chain/foreign')
  getBalanceForeign(
    @Param('chain') chain: string,
    @Body(new ZodValidationPipe(BalanceForeignDtoSchema))
    params: BalanceForeignDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_BALANCE_FOREIGN, req, {
      chain,
    });
    return this.balanceService.getBalanceForeign(chain, params);
  }

  @Post(':chain/asset')
  getAssetBalance(
    @Param('chain') chain: string,
    @Body(new ZodValidationPipe(BalanceForeignDtoSchema))
    params: BalanceForeignDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_ASSET_BALANCE, req, {
      chain,
    });
    return this.balanceService.getAssetBalance(chain, params);
  }

  @Post(':chain/existential-deposit')
  getExistentialDeposit(
    @Param('chain') chain: string,
    @Body(new ZodValidationPipe(ExistentialDepositDtoSchema))
    params: ExistentialDepositDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_EXISTENTIAL_DEPOSIT, req, {
      chain,
    });
    return this.balanceService.getExistentialDeposit(chain, params);
  }
}
