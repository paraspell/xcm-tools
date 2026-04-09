import { Controller, Get, Param, Query, Req, Request } from '@nestjs/common';
import type { TChain, TSubstrateChain } from '@paraspell/sdk';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { ChainSchema, SubstrateChainSchema } from '../dto/ChainDto.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import { ChainConfigsService } from './chain-configs.service.js';

@Controller('chains')
export class ChainConfigsController {
  constructor(
    private service: ChainConfigsService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get()
  getChains(@Req() req: Request) {
    this.analyticsService.track(EventName.GET_CHAINS, req);
    return this.service.getChainNames();
  }

  @Get(':chain/ws-endpoints')
  getWsEndpoints(
    @Param('chain', new ZodValidationPipe(SubstrateChainSchema))
    chain: TSubstrateChain,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_WS_ENDPOINTS, req);
    return this.service.getWsEndpoints(chain);
  }

  @Get(':chain/para-id')
  getParaId(
    @Param('chain', new ZodValidationPipe(ChainSchema))
    chain: TChain,
    @Req() req: Request,
  ) {
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
  hasDryRunSupport(
    @Param('chain', new ZodValidationPipe(SubstrateChainSchema))
    chain: TSubstrateChain,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.HAS_DRY_RUN_SUPPORT, req, {
      chain,
    });
    return this.service.hasDryRunSupport(chain);
  }
}
