import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Request,
} from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { AuthService } from './auth.service.js';
import { HigherRequestLimitDto } from './dto/HigherRequestLimitDto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private analyticsService: AnalyticsService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('generate')
  generateApiKey(
    @Body('recaptchaResponse') recaptcha: string,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GENERATE_API_KEY, req);
    return this.authService.generateApiKey(recaptcha);
  }

  @HttpCode(HttpStatus.OK)
  @Post('higher-request-limit-form')
  submitHigherRequestLimitForm(
    @Body() higherRequestLimitDto: HigherRequestLimitDto,
  ) {
    return this.authService.submitHigherRequestLimitForm(higherRequestLimitDto);
  }
}
