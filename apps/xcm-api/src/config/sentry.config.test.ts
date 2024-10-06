import { describe, it, expect, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { SentryModuleOptions } from '@ntegral/nestjs-sentry';
import { sentryConfig } from './sentry.config.js';

describe('sentryConfig', () => {
  const mockConfigService = {
    get: vi.fn(),
  } as unknown as ConfigService;

  it('should return the correct SentryModuleOptions with provided DSN', () => {
    mockConfigService.get = vi.fn().mockReturnValue('https://exampleSentryDsn');

    const spy = vi.spyOn(mockConfigService, 'get');

    const result: SentryModuleOptions = sentryConfig(mockConfigService);

    expect(result).toEqual({
      dsn: 'https://exampleSentryDsn',
      environment: 'test',
    });
    expect(spy).toHaveBeenCalledWith('SENTRY_DSN');
  });

  it('should return the correct environment when NODE_ENV is set', () => {
    process.env.NODE_ENV = 'production';
    mockConfigService.get = vi.fn().mockReturnValue('https://exampleSentryDsn');

    const result: SentryModuleOptions = sentryConfig(mockConfigService);

    expect(result).toEqual({
      dsn: 'https://exampleSentryDsn',
      environment: 'production',
    });
  });

  it('should default to development when NODE_ENV is not set', () => {
    delete process.env.NODE_ENV;
    mockConfigService.get = vi.fn().mockReturnValue('https://exampleSentryDsn');

    const result: SentryModuleOptions = sentryConfig(mockConfigService);

    expect(result).toEqual({
      dsn: 'https://exampleSentryDsn',
      environment: 'development', // environment defaults to development
    });
  });
});
