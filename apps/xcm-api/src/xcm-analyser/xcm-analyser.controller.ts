import { Controller, Request, Req, UsePipes, Body, Post } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import { XcmAnalyserService } from './xcm-analyser.service.js';
import { XcmAnalyserDto, XcmAnalyserSchema } from './dto/xcm-analyser.dto.js';

@Controller('xcm-analyser')
export class XcmAnalyserController {
  constructor(
    private xcmAnalyserService: XcmAnalyserService,
    private analyticsService: AnalyticsService,
  ) {}

  @Post()
  @UsePipes(new ZodValidationPipe(XcmAnalyserSchema))
  getMultiLocationPaths(
    @Body() bodyParams: XcmAnalyserDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.XCM_ANALYSER, req);
    return this.xcmAnalyserService.getMultiLocationPaths(bodyParams);
  }
}
