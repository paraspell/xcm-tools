import { Controller, Get, Param, Req } from '@nestjs/common';
import { PalletsService } from './pallets.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';

@Controller('pallets')
export class PalletsController {
  constructor(
    private palletsService: PalletsService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get(':node/default')
  getDefaultPallet(@Param('node') node: string, @Req() req) {
    this.analyticsService.track(EventName.GET_DEFAULT_PALLET, req, { node });
    return this.palletsService.getDefaultPallet(node);
  }

  @Get(':node')
  getPallets(@Param('node') node: string, @Req() req) {
    this.analyticsService.track(EventName.GET_SUPPORTED_PALLETS, req, { node });
    return this.palletsService.getPallets(node);
  }
}
