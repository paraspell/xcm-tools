import { describe, it, expect, vi } from 'vitest';
import { ThrottlerModuleOptions, ThrottlerOptions } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from '../types/types.js';
import { throttlerConfig } from './throttler.config.js';

describe('throttlerConfig', () => {
  const mockConfigService = {
    get: vi.fn(),
  } as unknown as ConfigService;

  const mockHttpContext = {
    switchToHttp: vi.fn().mockReturnThis(),
    getRequest: vi.fn(),
  };

  const mockExecutionContext = {
    switchToHttp: vi.fn(() => mockHttpContext),
  } as unknown as ExecutionContext;

  const getThrottlers = (
    result: ThrottlerModuleOptions,
  ): ThrottlerOptions[] => {
    if (Array.isArray(result)) {
      return result;
    }
    return result.throttlers;
  };

  it('should return 0 ttl when NODE_ENV is "test"', () => {
    process.env.NODE_ENV = 'test';
    const result: ThrottlerModuleOptions = throttlerConfig(mockConfigService);

    const throttlers = getThrottlers(result);
    expect(throttlers[0].ttl).toBe(0);
  });

  it('should return ttl from config when NODE_ENV is not "test"', () => {
    process.env.NODE_ENV = 'production';

    const spy = vi.spyOn(mockConfigService, 'get').mockReturnValue(60);

    const result: ThrottlerModuleOptions = throttlerConfig(mockConfigService);

    const throttlers = getThrottlers(result);

    expect(throttlers[0].ttl).toBe(60);
    expect(spy).toHaveBeenCalledWith('RATE_LIMIT_TTL_SEC');
  });

  it('should return request limit from user-specific requestLimit when present', () => {
    mockConfigService.get = vi.fn();
    mockHttpContext.getRequest = vi.fn().mockReturnValue({
      user: { requestLimit: 100 },
    } as RequestWithUser);

    const result: ThrottlerModuleOptions = throttlerConfig(mockConfigService);
    const throttlers = getThrottlers(result);
    const limit = (
      throttlers[0].limit as (context: ExecutionContext) => number
    )(mockExecutionContext);

    expect(limit).toBe(100);
  });

  it('should return authenticated request limit from config when user is authenticated and requestLimit is not set', () => {
    const spy = vi.spyOn(mockConfigService, 'get').mockReturnValue(50);

    mockHttpContext.getRequest = vi.fn().mockReturnValue({
      user: {}, // User without a specific requestLimit
    } as RequestWithUser);

    const result: ThrottlerModuleOptions = throttlerConfig(mockConfigService);
    const throttlers = getThrottlers(result);
    const limit = (
      throttlers[0].limit as (context: ExecutionContext) => number
    )(mockExecutionContext);

    expect(limit).toBe(50);
    expect(spy).toHaveBeenCalledWith('RATE_LIMIT_REQ_COUNT_AUTH');
  });

  it('should return public request limit from config when user is not authenticated', () => {
    const spy = vi.spyOn(mockConfigService, 'get').mockReturnValue(20);

    mockHttpContext.getRequest = vi.fn().mockReturnValue({
      user: undefined, // No user, public request
    } as RequestWithUser);

    const result: ThrottlerModuleOptions = throttlerConfig(mockConfigService);
    const throttlers = getThrottlers(result);
    const limit = (
      throttlers[0].limit as (context: ExecutionContext) => number
    )(mockExecutionContext);

    expect(limit).toBe(20);
    expect(spy).toHaveBeenCalledWith('RATE_LIMIT_REQ_COUNT_PUBLIC');
  });
});
