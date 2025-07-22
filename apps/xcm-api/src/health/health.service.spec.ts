import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HealthCheckService,
  PrismaHealthIndicator,
  HealthIndicatorStatus,
  HealthCheckResult,
} from '@nestjs/terminus';
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

      vi.mocked(prismaHealthIndicator.pingCheck).mockReturnValue(
        mockPingCheckResult,
      );

      vi.mocked(healthCheckService.check).mockImplementation(async (checks) => {
        await checks[0]();
        return mockResult;
      });

      const result = await service.checkDb();

      expect(prismaHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'database',
        prismaService,
      );
      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ]);
      expect(result).toEqual(mockResult);
    });
  });
});
