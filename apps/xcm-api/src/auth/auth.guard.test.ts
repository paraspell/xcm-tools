import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { describe, expect, it, vi } from 'vitest';

import type { AnalyticsService } from '../analytics/analytics.service.js';
import type { UsersService } from '../users/users.service.js';
import { AuthGuard } from './auth.guard.js';

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
