import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from '../analytics/analytics.service.js';
import type { RouterBestAmountOutDto, RouterDto } from './dto/RouterDto.js';
import { RouterController } from './router.controller.js';
import { RouterService } from './router.service.js';

// Integration tests to ensure controller and service are working together
describe('RouterController', () => {
  let controller: RouterController;
  let service: RouterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RouterController],
      providers: [
        RouterService,
        {
          provide: AnalyticsService,
          useValue: { get: () => '', track: vi.fn() },
        },
      ],
    }).compile();

    controller = module.get<RouterController>(RouterController);
    service = module.get<RouterService>(RouterService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateXcmCall', () => {
    it('should call generateExtrinsics service method with correct parameters and return result', async () => {
      const queryParams: RouterDto = {
        from: 'Astar',
        exchange: 'AcalaDex',
        to: 'Moonbeam',
        currencyFrom: { symbol: 'ASTR' },
        currencyTo: { symbol: 'GLMR' },
        amount: '1000000000000000000',
        senderAddress: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
        recipientAddress: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
      };

      const mockResult: Awaited<ReturnType<typeof service.generateExtrinsics>> =
        [];
      const spy = vi
        .spyOn(service, 'generateExtrinsics')
        .mockResolvedValue(mockResult);

      const result = await controller.generateExtrinsics(
        queryParams,
        {} as unknown as Request,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(queryParams);
    });

    it('should call generateExtrinsics service method with correct parameters and return result', async () => {
      const queryParams: RouterDto = {
        from: 'Astar',
        exchange: 'AcalaDex',
        to: 'Moonbeam',
        currencyFrom: { symbol: 'ASTR' },
        currencyTo: { symbol: 'GLMR' },
        amount: '1000000000000000000',
        senderAddress: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
        recipientAddress: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
      };

      const mockResult: Awaited<ReturnType<typeof service.generateExtrinsics>> =
        [];
      const spy = vi
        .spyOn(service, 'generateExtrinsics')
        .mockResolvedValue(mockResult);

      const result = await controller.generateExtrinsics(
        queryParams,
        {} as unknown as Request,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(queryParams);
    });
  });

  describe('getBestAmountOut', () => {
    it('should call getBestAmount out service method with correct parameters and return result', async () => {
      const queryParams: RouterBestAmountOutDto = {
        from: 'Astar',
        exchange: 'AcalaDex',
        to: 'Moonbeam',
        currencyFrom: { symbol: 'ASTR' },
        currencyTo: { symbol: 'GLMR' },
        amount: '1000000000000000000',
      };

      const mockResult: Awaited<ReturnType<typeof service.getBestAmountOut>> = {
        exchange: 'AcalaDex',
        amountOut: 1000000000000000000n,
      };

      const spy = vi
        .spyOn(service, 'getBestAmountOut')
        .mockResolvedValue(mockResult);

      const result = await controller.getBestAmountOut(
        queryParams,
        {} as unknown as Request,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(queryParams);
    });
  });
});
