import { vi, describe, beforeEach, it, expect } from 'vitest';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { XTransferController } from './x-transfer.controller.js';
import { XTransferService } from './x-transfer.service.js';
import { mockRequestObject } from '../testUtils.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import type { XTransferDto } from './dto/XTransferDto.js';
import type { BatchXTransferDto } from './dto/XTransferBatchDto.js';
import { BatchMode } from '@paraspell/sdk';

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

  describe('getDryRun', () => {
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

      const result = await controller.dryRun(bodyParams, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(bodyParams, true);
    });
  });
});
