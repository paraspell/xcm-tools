import { SentryModuleOptions } from '@ntegral/nestjs-sentry';
import { ConfigService } from '@nestjs/config';

export const sentryConfig = (config: ConfigService): SentryModuleOptions => ({
  dsn: config.get('SENTRY_DSN'),
  environment: process.env.NODE_ENV || 'development',
});
