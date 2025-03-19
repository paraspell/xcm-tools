import { Body, Controller, Post, Req, Request, UsePipes } from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import { CreateIdentityDto, CreateIdentitySchema } from './dto/identity.dto.js';
import { IdentityService } from './identity.service.js';

@Controller()
export class IdentityController {
  constructor(
    private identityService: IdentityService,
    private analyticsService: AnalyticsService,
  ) {}

  private trackAnalytics(
    eventName: EventName,
    req: Request,
    params: CreateIdentityDto,
  ) {
    const { from, maxRegistrarFee, regIndex } = params;
    this.analyticsService.track(eventName, req, {
      from: from || 'unknown',
      maxRegistrarFee: maxRegistrarFee || 'unknown',
      regIndex: regIndex || 'unknown',
    });
  }

  @Post('identity')
  @UsePipes(new ZodValidationPipe(CreateIdentitySchema))
  createIdentityCall(
    @Body() bodyParams: CreateIdentityDto,
    @Req() req: Request,
  ) {
    this.trackAnalytics(EventName.CREATE_IDENTITY, req, bodyParams);
    return this.identityService.createIdentityCall(bodyParams);
  }
}
