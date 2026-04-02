import type { HealthCheckResult } from '@nestjs/terminus';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
      const spy = vi
        .spyOn(healthService, 'checkDb')
        .mockResolvedValue(
          mockDbResult as Awaited<ReturnType<HealthService['checkDb']>>,
        );

      const result = await controller.checkDb();

      expect(spy).toHaveBeenCalledOnce();
      expect(result).toEqual(mockDbResult);
    });

    it('should handle database check errors', async () => {
      const mockError = new Error('Database connection failed');
      const spy = vi
        .spyOn(healthService, 'checkDb')
        .mockRejectedValue(mockError);

      await expect(controller.checkDb()).rejects.toThrow(
        'Database connection failed',
      );
      expect(spy).toHaveBeenCalledOnce();
    });
  });
});
