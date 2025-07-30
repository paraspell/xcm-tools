import { Controller, Get, Query, Req, Request } from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { AddressService } from './address.service.js';
import { ConvertSs58Dto } from './dto/ConvertSs58Dto.js';

@Controller()
export class AddressController {
  constructor(
    private addressService: AddressService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get('convert-ss58')
  convertSs58(
    @Query() { address, chain }: ConvertSs58Dto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.CONVERT_SS58, req, { chain });
    return this.addressService.convertSs58(address, chain);
  }
}
