import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthIndicatorStatus,
  HealthCheckResult,
} from '@nestjs/terminus';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  let service: HealthService;
  let healthCheckService: HealthCheckService;
  let typeOrmHealthIndicator: TypeOrmHealthIndicator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: HealthCheckService,
          useValue: { check: vi.fn() },
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: { pingCheck: vi.fn() },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    typeOrmHealthIndicator = module.get<TypeOrmHealthIndicator>(
      TypeOrmHealthIndicator,
    );
  });

  describe('checkDb', () => {
    it('should call health.check with database ping check', async () => {
      const mockResult = { status: 'ok' } as HealthCheckResult;
      const mockPingCheckResult = Promise.resolve({
        database: { status: 'up' as HealthIndicatorStatus },
      });

      vi.mocked(typeOrmHealthIndicator.pingCheck).mockReturnValue(
        mockPingCheckResult,
      );

      vi.mocked(healthCheckService.check).mockImplementation(async (checks) => {
        await checks[0]();
        return mockResult;
      });

      const result = await service.checkDb();

      expect(typeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ]);
      expect(result).toEqual(mockResult);
    });
  });
});
