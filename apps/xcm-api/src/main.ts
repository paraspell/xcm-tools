/* eslint-disable simple-import-sort/imports */
import { init as sentryInit } from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { ExpressAdapter } from '@nestjs/platform-express';
import { replaceBigInt } from '@paraspell/sdk';

import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';

export const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const dsn = configService.get<string>('SENTRY_DSN');

  if (dsn) {
    sentryInit({
      dsn: configService.get<string>('SENTRY_DSN'),
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
      environment: configService.get<string>('NODE_ENV') || 'development',
    });
  }

  (app.getHttpAdapter().getInstance() as ExpressAdapter).set(
    'json replacer',
    replaceBigInt,
  );

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  const DEFAULT_PORT = 3001;
  await app.listen(process.env.PORT || DEFAULT_PORT);
};

void bootstrap();
