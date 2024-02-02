import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { RouterController } from './router.controller.js';
import { RouterService } from './router.service.js';
import { RouterDto } from './dto/RouterDto.js';
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
      const queryParams: RouterDto = {
        from: 'Astar',
        exchange: 'AcalaDex',
        to: 'Moonbeam',
        currencyFrom: 'ASTR',
        currencyTo: 'GLMR',
        amount: '1000000000000000000',
        injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
        recipientAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
      };

      const mockResult = 'serialized-extrinsics';

      vi.spyOn(service, 'generateExtrinsics').mockResolvedValue(
        mockResult as any,
      );

      const result = await controller.generateExtrinsics(
        queryParams,
        {} as any,
      );

      expect(result).toBe(mockResult);
      expect(service.generateExtrinsics).toHaveBeenCalledWith(queryParams);
    });
  });
});
