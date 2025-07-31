import { Body, Controller, Post, Req, Request, UsePipes } from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import { XcmAnalyserDto, XcmAnalyserSchema } from './dto/xcm-analyser.dto.js';
import { XcmAnalyserService } from './xcm-analyser.service.js';

@Controller('xcm-analyser')
export class XcmAnalyserController {
  constructor(
    private xcmAnalyserService: XcmAnalyserService,
    private analyticsService: AnalyticsService,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(XcmAnalyserSchema))
  getLocationPaths(@Body() bodyParams: XcmAnalyserDto, @Req() req: Request) {
    this.analyticsService.track(EventName.XCM_ANALYSER, req);
    return this.xcmAnalyserService.getLocationPaths(bodyParams);
  }
}
