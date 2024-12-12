import { vi, describe, beforeEach, it, expect } from 'vitest';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { mockRequestObject } from '../testUtils.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import type { TSerializedEthTransfer } from '@paraspell/sdk';
import { XTransferEthController } from './x-transfer-eth.controller.js';
import { XTransferEthService } from './x-transfer-eth.service.js';
import type { XTransferEthDto } from './dto/x-transfer-eth.dto.js';

describe('XTransferEthController', () => {
  let controller: XTransferEthController;
  let service: XTransferEthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [XTransferEthController],
      providers: [
        XTransferEthService,
        {
          provide: AnalyticsService,
          useValue: { get: () => '', track: vi.fn() },
        },
      ],
    }).compile();

    controller = module.get<XTransferEthController>(XTransferEthController);
    service = module.get<XTransferEthService>(XTransferEthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateXcmCall', () => {
    it('should call generateXcmCall service method with correct parameters and return result', async () => {
      const queryParams: XTransferEthDto = {
        to: 'AssetHubPolkadot',
        address: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
        currency: { symbol: 'WETH', amount: 100 },
        destAddress: '0x5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
      };
      const mockResult = {} as TSerializedEthTransfer;
      const spy = vi
        .spyOn(service, 'generateEthCall')
        .mockResolvedValue(mockResult);

      const result = await controller.generateXcmCall(
        queryParams,
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(queryParams);
    });
  });
});
