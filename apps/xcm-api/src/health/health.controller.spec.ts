import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthCheckResult, HealthCheckStatus } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  beforeEach(async () => {
    const mockHealthService = {
      checkDb: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  describe('checkApp', () => {
    it('should return status ok', () => {
      const result = controller.checkApp();

      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('checkDb', () => {
    it('should call healthService.checkDb and return its result', async () => {
      const mockDbResult: HealthCheckResult = {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      };
      vi.mocked(healthService.checkDb).mockResolvedValue(mockDbResult);

      const result = await controller.checkDb();

      expect(healthService.checkDb).toHaveBeenCalledOnce();
      expect(result).toEqual(mockDbResult);
    });

    it('should handle database check errors', async () => {
      const mockError = new Error('Database connection failed');
      vi.mocked(healthService.checkDb).mockRejectedValue(mockError);

      await expect(controller.checkDb()).rejects.toThrow(
        'Database connection failed',
      );
      expect(healthService.checkDb).toHaveBeenCalledOnce();
    });
  });
});
