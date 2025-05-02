import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type {
  TBridgeStatus,
  TDryRunResult,
  TGetXcmFeeEstimateResult,
  TGetXcmFeeResult,
} from '@paraspell/sdk';
import { BatchMode } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { mockRequestObject } from '../testUtils.js';
import type { BatchXTransferDto } from './dto/XTransferBatchDto.js';
import type { XTransferDto } from './dto/XTransferDto.js';
import { XTransferController } from './x-transfer.controller.js';
import { XTransferService } from './x-transfer.service.js';

// Integration tests to ensure controller and service are working together
describe('XTransferController', () => {
  let controller: XTransferController;
  let service: XTransferService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [XTransferController],
      providers: [
        XTransferService,
        {
          provide: AnalyticsService,
          useValue: { get: () => '', track: vi.fn() },
        },
      ],
    }).compile();

    controller = module.get<XTransferController>(XTransferController);
    service = module.get<XTransferService>(XTransferService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateXcmCall', () => {
    it('should call generateXcmCall service method with correct parameters and return result', async () => {
      const bodyParams: XTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        address: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
        currency: { symbol: 'DOT', amount: 100 },
      };
      const mockResult = 'hash';
      const spy = vi
        .spyOn(service, 'generateXcmCall')
        .mockResolvedValue(mockResult);

      const result = await controller.generateXcmCall(
        bodyParams,
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(bodyParams);
    });
  });

  describe('generateXcmCallBatch', () => {
    it('should call generateXcmCall service method with correct parameters and return result', async () => {
      const bodyParams: BatchXTransferDto = {
        transfers: [
          {
            from: 'Acala',
            to: 'Astar',
            address: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
            currency: { symbol: 'ACA', amount: 100 },
          },
          {
            from: 'Acala',
            to: 'Astar',
            address: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
            currency: { symbol: 'ACA', amount: 100 },
          },
        ],
        options: { mode: BatchMode.BATCH },
      };
      const mockResult = 'hash';
      const spy = vi
        .spyOn(service, 'generateBatchXcmCall')
        .mockResolvedValue(mockResult);

      const result = await controller.generateXcmCallBatch(
        bodyParams,
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(bodyParams);
    });
  });

  describe('dryRun', () => {
    it('should call generateXcmCall service method with correct parameters and return result', async () => {
      const bodyParams: XTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        address: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
        currency: { symbol: 'DOT', amount: 100 },
      };
      const mockResult = {} as TDryRunResult;
      const spy = vi.spyOn(service, 'dryRun').mockResolvedValue(mockResult);

      const result = await controller.dryRun(bodyParams, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(bodyParams);
    });
  });

  describe('getXcmFee', () => {
    it('should call service.getXcmFee and returns its value', async () => {
      const bodyParams: XTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        address: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
        currency: { symbol: 'DOT', amount: 100 },
      };
      const mockResult = { origin: {}, destination: {} } as TGetXcmFeeResult;
      const spy = vi.spyOn(service, 'getXcmFee').mockResolvedValue(mockResult);

      const result = await controller.getXcmFee(bodyParams, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(bodyParams);
    });
  });

  describe('getXcmFeeEstimate', () => {
    it('should call service.getXcmFeeEstimate and returns its value', async () => {
      const bodyParams: XTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        address: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
        currency: { symbol: 'DOT', amount: 100 },
      };
      const mockResult = {
        origin: {},
        destination: {},
      } as TGetXcmFeeEstimateResult;
      const spy = vi
        .spyOn(service, 'getXcmFeeEstimate')
        .mockResolvedValue(mockResult);

      const result = await controller.getXcmFeeEstimate(
        bodyParams,
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(bodyParams);
    });
  });

  describe('getBridgeStatus', () => {
    it('should call getBridgeStatus service method and return result', async () => {
      const mockResult: TBridgeStatus = 'Normal';
      const spy = vi
        .spyOn(service, 'getBridgeStatus')
        .mockResolvedValue(mockResult);

      const result = await controller.getBridgeStatus();

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalled();
    });
  });
});
