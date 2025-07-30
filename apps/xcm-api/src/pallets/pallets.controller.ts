import { Controller, Get, Param, Query, Req, Request } from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { PalletIndexDto } from './dto/PalletIndexDto.js';
import { PalletsService } from './pallets.service.js';

@Controller('pallets')
export class PalletsController {
  constructor(
    private palletsService: PalletsService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get(':chain/default')
  getDefaultPallet(@Param('chain') chain: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_DEFAULT_PALLET, req, { chain });
    return Promise.resolve(this.palletsService.getDefaultPallet(chain));
  }

  @Get(':chain')
  getPallets(@Param('chain') chain: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_SUPPORTED_PALLETS, req, {
      chain,
    });
    return Promise.resolve(this.palletsService.getPallets(chain));
  }

  @Get(':chain/index')
  getPalletIndex(
    @Param('chain') chain: string,
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
