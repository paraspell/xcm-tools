import { Controller, Get, Param, Query, Req, Request } from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { ChainConfigsService } from './chain-configs.service.js';

@Controller('chains')
export class ChainConfigsController {
  constructor(
    private service: ChainConfigsService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get()
  getChainNames(@Req() req: Request) {
    this.analyticsService.track(EventName.GET_CHAIN_NAMES, req);
    return this.service.getChainNames();
  }

  @Get(':chain/ws-endpoints')
  getWsEndpoints(@Param('chain') chain: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_CHAIN_NAMES, req);
    return this.service.getWsEndpoints(chain);
  }

  @Get(':chain/para-id')
  getParaId(@Param('chain') chain: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_PARA_ID, req, {
      chain,
    });
    return this.service.getParaId(chain);
  }

  @Get(':paraId')
  getAssetsObject(
    @Param('paraId') paraId: string,
    @Query('ecosystem') ecosystem: string | undefined,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_CHAIN_BY_PARA_ID, req, {
      paraId,
    });
    return this.service.getChainByParaId(Number(paraId), ecosystem);
  }

  @Get(':chain/has-dry-run-support')
  hasDryRunSupport(@Param('chain') chain: string, @Req() req: Request) {
    this.analyticsService.track(EventName.HAS_DRY_RUN_SUPPORT, req, {
      chain,
    });
    return this.service.hasDryRunSupport(chain);
  }
}
