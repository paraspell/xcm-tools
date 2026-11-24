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
    const isProduction = configService.get<string>('NODE_ENV') === 'production';

    // Use lower sampling rates in production to avoid excessive data collection.
    // Disable sampling entirely in non‑production environments.
    const tracesSampleRate = isProduction ? 0.1 : 0;
    const profileSessionSampleRate = isProduction ? 0.1 : 0;

    sentryInit({
      dsn,
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate,
      profileSessionSampleRate,
      profileLifecycle: 'trace',
      environment: configService.get<string>('NODE_ENV') || 'development',
    });
  }

  const expressApp = app.getHttpAdapter().getInstance() as ExpressAdapter;
  expressApp.set('json replacer', replaceBigInt);
  expressApp.set('trust proxy', 1);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  const DEFAULT_PORT = 3001;
  await app.listen(process.env.PORT || DEFAULT_PORT);
};

void bootstrap();
