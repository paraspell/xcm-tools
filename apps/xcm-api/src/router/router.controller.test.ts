import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { RouterController } from './router.controller.js';
import { RouterService } from './router.service.js';
import { type PatchedRouterDto } from './dto/RouterDto.js';
import { AnalyticsService } from '../analytics/analytics.service.js';

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
      const queryParams: PatchedRouterDto = {
        from: 'Astar',
        exchange: 'AcalaDex',
        to: 'Moonbeam',
        currencyFrom: { symbol: 'ASTR' },
        currencyTo: { symbol: 'GLMR' },
        amount: '1000000000000000000',
        injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
        recipientAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
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

    it('should call generateExtrinsics service method with correct parameters and return result - hash', async () => {
      const queryParams: PatchedRouterDto = {
        from: 'Astar',
        exchange: 'AcalaDex',
        to: 'Moonbeam',
        currencyFrom: { symbol: 'ASTR' },
        currencyTo: { symbol: 'GLMR' },
        amount: '1000000000000000000',
        injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
        recipientAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
      };

      const mockResult: Awaited<ReturnType<typeof service.generateExtrinsics>> =
        [];
      const spy = vi
        .spyOn(service, 'generateExtrinsics')
        .mockResolvedValue(mockResult);

      const result = await controller.generateExtrinsicsV2Hash(
        queryParams,
        {} as unknown as Request,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(queryParams, true);
    });

    it('should call generateExtrinsics service method with correct parameters and return result - V2 POST', async () => {
      const queryParams: PatchedRouterDto = {
        from: 'Astar',
        exchange: 'AcalaDex',
        to: 'Moonbeam',
        currencyFrom: { symbol: 'ASTR' },
        currencyTo: { symbol: 'GLMR' },
        amount: '1000000000000000000',
        injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
        recipientAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
      };

      const mockResult: Awaited<ReturnType<typeof service.generateExtrinsics>> =
        [];
      const spy = vi
        .spyOn(service, 'generateExtrinsics')
        .mockResolvedValue(mockResult);

      const result = await controller.generateExtrinsicsV2(
        queryParams,
        {} as unknown as Request,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(queryParams);
    });
  });
});
