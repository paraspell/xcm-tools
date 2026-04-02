import type {
  HealthCheckResult,
  HealthIndicatorStatus,
} from '@nestjs/terminus';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../prisma/prisma.service.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  let service: HealthService;
  let healthCheckService: HealthCheckService;
  let prismaHealthIndicator: PrismaHealthIndicator;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: HealthCheckService,
          useValue: { check: vi.fn() },
        },
        {
          provide: PrismaHealthIndicator,
          useValue: { pingCheck: vi.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    prismaHealthIndicator = module.get<PrismaHealthIndicator>(
      PrismaHealthIndicator,
    );
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('checkDb', () => {
    it('should call health.check with database ping check', async () => {
      const mockResult = { status: 'ok' } as HealthCheckResult;
      const mockPingCheckResult = Promise.resolve({
        database: { status: 'up' as HealthIndicatorStatus },
      });

      const spyPingCheck = vi
        .spyOn(prismaHealthIndicator, 'pingCheck')
        .mockReturnValue(mockPingCheckResult);

      const spyHealthCheck = vi
        .spyOn(healthCheckService, 'check')
        .mockImplementation(async (checks) => {
          await checks[0]();
          return mockResult;
        });

      const result = await service.checkDb();

      expect(spyPingCheck).toHaveBeenCalledWith('database', prismaService);
      expect(spyHealthCheck).toHaveBeenCalledWith([expect.any(Function)]);
      expect(result).toEqual(mockResult);
    });
  });
});
