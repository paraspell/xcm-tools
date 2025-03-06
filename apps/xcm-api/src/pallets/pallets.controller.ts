import { Controller, Get, Param, Req, Request } from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { PalletsService } from './pallets.service.js';

@Controller('pallets')
export class PalletsController {
  constructor(
    private palletsService: PalletsService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get(':node/default')
  getDefaultPallet(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_DEFAULT_PALLET, req, { node });
    return Promise.resolve(this.palletsService.getDefaultPallet(node));
  }

  @Get(':node')
  getPallets(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_SUPPORTED_PALLETS, req, { node });
    return Promise.resolve(this.palletsService.getPallets(node));
  }
}
