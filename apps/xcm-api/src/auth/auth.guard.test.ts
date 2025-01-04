import { describe, it, expect, vi } from 'vitest';
import { AuthGuard } from './auth.guard.js';
import { ForbiddenException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { UsersService } from '../users/users.service.js';
import type { AnalyticsService } from '../analytics/analytics.service.js';
import type { ExecutionContext } from '@nestjs/common';

describe('AuthGuard (try/catch)', () => {
  it('should catch the error and throw a ForbiddenException when JWT verification fails', async () => {
    const mockJwtService = {
      verify: vi.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      }),
    } as unknown as JwtService;

    const mockUsersService = {
      findOne: vi.fn(),
    } as unknown as UsersService;

    const mockAnalyticsService = {
      identify: vi.fn(),
    } as unknown as AnalyticsService;

    const guard = new AuthGuard(
      mockJwtService,
      mockUsersService,
      mockAnalyticsService,
    );

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            'x-api-key': 'someInvalidKey',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
