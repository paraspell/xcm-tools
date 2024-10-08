import { Body, Controller, Param, Post, Req, Request } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { BalanceService } from './balance.service.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import {
  BalanceNativeDto,
  BalanceNativeDtoSchema,
} from './dto/BalanceNativeDto.js';
import {
  BalanceForeignDto,
  BalanceForeignDtoSchema,
} from './dto/BalanceForeignDto.js';

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
}
