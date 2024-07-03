import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Redirect('https://lightspell.xyz/', 301)
  root() {}

  @Get('sentry-test')
  sentryTest() {
    if (process.env.NODE_ENV === 'production') {
      return 'Sentry test is only available in development mode.';
    }
    throw new Error('Sentry test');
  }
}
