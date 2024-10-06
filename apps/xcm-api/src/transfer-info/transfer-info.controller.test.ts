import { vi, describe, beforeEach, it, expect } from 'vitest';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { mockRequestObject } from '../testUtils.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { TransferInfoController } from './transfer-info.controller.js';
import { TransferInfoService } from './transfer-info.service.js';
import type { PatchedTransferInfoDto } from './dto/transfer-info.dto.js';
import type { TTransferInfo } from '@paraspell/sdk';

describe('TransferInfoController', () => {
  let controller: TransferInfoController;
  let service: TransferInfoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferInfoController],
      providers: [
        TransferInfoService,
        {
          provide: AnalyticsService,
          useValue: { get: () => '', track: vi.fn() },
        },
      ],
    }).compile();

    controller = module.get<TransferInfoController>(TransferInfoController);
    service = module.get<TransferInfoService>(TransferInfoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateXcmCall', () => {
    it('should call generateXcmCall service method with correct parameters and return result', async () => {
      const queryParams: PatchedTransferInfoDto = {
        origin: 'Acala',
        destination: 'Basilisk',
        accountOrigin: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
        accountDestination: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
        currency: { symbol: 'DOT' },
        amount: 100,
      };
      const mockResult = {} as TTransferInfo;
      const spy = vi
        .spyOn(service, 'getTransferInfo')
        .mockResolvedValue(mockResult);

      const result = await controller.getTransferInfo(
        queryParams,
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(queryParams);
    });
  });
});
