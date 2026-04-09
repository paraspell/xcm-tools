import { Controller, Get, Param, Query, Req, Request } from '@nestjs/common';
import type { TSubstrateChain } from '@paraspell/sdk';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { SubstrateChainSchema } from '../dto/ChainDto.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import { PalletIndexDto } from './dto/PalletIndexDto.js';
import { PalletsService } from './pallets.service.js';

@Controller('pallets')
export class PalletsController {
  constructor(
    private palletsService: PalletsService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get(':chain/default')
  getDefaultPallet(
    @Param('chain', new ZodValidationPipe(SubstrateChainSchema))
    chain: TSubstrateChain,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_DEFAULT_PALLET, req, { chain });
    return Promise.resolve(this.palletsService.getDefaultPallet(chain));
  }

  @Get(':chain/native-assets')
  getNativeAssetsPallet(
    @Param('chain', new ZodValidationPipe(SubstrateChainSchema))
    chain: TSubstrateChain,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_NATIVE_ASSETS_PALLET, req, {
      chain,
    });
    return Promise.resolve(this.palletsService.getNativeAssetsPallet(chain));
  }

  @Get(':chain/other-assets')
  getOtherAssetsPallets(
    @Param('chain', new ZodValidationPipe(SubstrateChainSchema))
    chain: TSubstrateChain,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_OTHER_ASSETS_PALLETS, req, {
      chain,
    });
    return Promise.resolve(this.palletsService.getOtherAssetsPallets(chain));
  }

  @Get(':chain')
  getPallets(
    @Param('chain', new ZodValidationPipe(SubstrateChainSchema))
    chain: TSubstrateChain,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_SUPPORTED_PALLETS, req, {
      chain,
    });
    return Promise.resolve(this.palletsService.getPallets(chain));
  }

  @Get(':chain/index')
  getPalletIndex(
    @Param('chain', new ZodValidationPipe(SubstrateChainSchema))
    chain: TSubstrateChain,
    @Query() { pallet }: PalletIndexDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_PALLET_INDEX, req, {
      chain,
      pallet,
    });
    return Promise.resolve(
      JSON.stringify(this.palletsService.getPalletIndex(chain, pallet)),
    );
  }
}
