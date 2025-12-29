import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';

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
  async submitHigherRequestLimitForm(
    @Body() higherRequestLimitDto: HigherRequestLimitDto,
    @Headers('x-forwarded-prefix') forwardedPrefix: string | undefined,
    @Res() res: Response,
  ) {
    await this.authService.submitHigherRequestLimitForm(higherRequestLimitDto);
    const apiPrefix = forwardedPrefix ?? '';
    return res.redirect(
      `${apiPrefix}/app/higher-request-limit/submit-success.html`,
    );
  }
}
