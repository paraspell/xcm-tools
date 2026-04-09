import { Body, Controller, Param, Post, Req, Request } from '@nestjs/common';
import type { TChain } from '@paraspell/sdk';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { ChainSchema } from '../dto/ChainDto.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import { BalanceService } from './balance.service.js';
import { BalanceDto, BalanceDtoSchema } from './dto/BalanceForeignDto.js';
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
    @Param('chain', new ZodValidationPipe(ChainSchema))
    chain: TChain,
    @Body(new ZodValidationPipe(BalanceDtoSchema))
    params: BalanceDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_ASSET_BALANCE, req, {
      chain,
    });
    return this.balanceService.getBalance(chain, params);
  }

  @Post(':chain/existential-deposit')
  getExistentialDeposit(
    @Param('chain', new ZodValidationPipe(ChainSchema))
    chain: TChain,
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
