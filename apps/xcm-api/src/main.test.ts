/* eslint-disable @typescript-eslint/unbound-method */
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { init as sentryInit } from '@sentry/nestjs';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppModule } from './app.module.js';

vi.mock('@sentry/nestjs', () => ({
  init: vi.fn(),
}));

vi.mock('@nestjs/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nestjs/core')>();
  return {
    ...actual,
    NestFactory: {
      create: vi.fn(),
    },
  };
});

describe('Application Bootstrap', () => {
  let mockApp: {
    enableCors: Mock;
    useGlobalPipes: Mock;
    listen: Mock;
    getHttpAdapter: () => { getInstance: () => { set: Mock } };
    get: Mock;
  };
  let mockConfigService: {
    get: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockConfigService = {
      get: vi.fn().mockReturnValue(null),
    };

    mockApp = {
      enableCors: vi.fn(),
      useGlobalPipes: vi.fn(),
      listen: vi.fn(),
      get: vi.fn((token) => {
        if (token === ConfigService) {
          return mockConfigService;
        }
        return null;
      }),
      getHttpAdapter: () => ({ getInstance: () => ({ set: vi.fn() }) }),
    };

    (NestFactory.create as Mock).mockResolvedValue(mockApp);
  });

  it('should bootstrap the application and listen on the correct port', async () => {
    const { bootstrap } = await import('./main.js');

    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);

    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.useGlobalPipes).toHaveBeenCalledWith(
      expect.any(ValidationPipe),
    );

    expect(mockApp.listen).toHaveBeenCalledWith(process.env.PORT || 3001);
  });

  it('should call sentryInit when SENTRY_DSN is set', async () => {
    const fakeDsn = 'https://fake@sentry.io/12345';

    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'SENTRY_DSN') return fakeDsn;
      if (key === 'NODE_ENV') return 'production';
      return null;
    });

    const { bootstrap } = await import('./main.js');

    await bootstrap();

    expect(sentryInit).toHaveBeenCalledWith({
      dsn: fakeDsn,
      integrations: expect.any(Array),
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
      environment: 'production',
    });
  });

  it('should not call sentryInit when SENTRY_DSN is not set', async () => {
    const { bootstrap } = await import('./main.js');

    await bootstrap();

    expect(sentryInit).not.toHaveBeenCalled();
  });
});
