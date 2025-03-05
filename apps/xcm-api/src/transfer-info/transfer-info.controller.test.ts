import { vi, describe, beforeEach, it, expect } from 'vitest';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { mockRequestObject } from '../testUtils.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { TransferInfoController } from './transfer-info.controller.js';
import { TransferInfoService } from './transfer-info.service.js';
import type { TransferInfoDto } from './dto/transfer-info.dto.js';
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

  describe('getTransferInfo', () => {
    it('should call getTransferInfo service method with correct parameters and return result', async () => {
      const queryParams: TransferInfoDto = {
        origin: 'Acala',
        destination: 'Basilisk',
        accountOrigin: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
        accountDestination: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
        currency: { symbol: 'DOT', amount: 100 },
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
