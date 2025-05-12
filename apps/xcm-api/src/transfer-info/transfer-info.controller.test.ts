import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { TTransferInfo } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { mockRequestObject } from '../testUtils.js';
import type { TransferInfoDto } from './dto/transfer-info.dto.js';
import { TransferInfoController } from './transfer-info.controller.js';
import { TransferInfoService } from './transfer-info.service.js';

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
        accountOrigin: '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz',
        accountDestination: '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz',
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
