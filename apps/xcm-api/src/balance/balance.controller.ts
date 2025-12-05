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
  ExistentialDepositDto,
  ExistentialDepositDtoSchema,
} from './dto/ExistentialDepositDto.js';

@Controller('balance')
export class BalanceController {
  constructor(
    private balanceService: BalanceService,
    private analyticsService: AnalyticsService,
  ) {}

  @Post(':chain')
  getBalance(
    @Param('chain') chain: string,
    @Body(new ZodValidationPipe(BalanceForeignDtoSchema))
    params: BalanceForeignDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_ASSET_BALANCE, req, {
      chain,
    });
    return this.balanceService.getBalance(chain, params);
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
