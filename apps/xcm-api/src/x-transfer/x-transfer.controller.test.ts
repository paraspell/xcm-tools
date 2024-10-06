import { vi, describe, beforeEach, it, expect } from 'vitest';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { XTransferController } from './x-transfer.controller.js';
import { XTransferService } from './x-transfer.service.js';
import { mockRequestObject } from '../testUtils.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import type { PatchedXTransferDto } from './dto/XTransferDto.js';
import type { Extrinsic } from '@paraspell/sdk';

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
      const queryParams: PatchedXTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        amount: 100,
        address: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
        currency: { symbol: 'DOT' },
      };
      const mockResult = {} as Extrinsic;
      const spy = vi
        .spyOn(service, 'generateXcmCall')
        .mockResolvedValue(mockResult);

      const result = await controller.generateXcmCall(
        queryParams,
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(queryParams);
    });
  });

  describe('generateXcmCallV2', () => {
    it('should call generateXcmCall service method with correct parameters and return result', async () => {
      const bodyParams: PatchedXTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        amount: '100',
        address: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
        currency: { symbol: 'DOT' },
      };
      const mockResult = {} as Extrinsic;
      const spy = vi
        .spyOn(service, 'generateXcmCall')
        .mockResolvedValue(mockResult);

      const result = await controller.generateXcmCallV2(
        bodyParams,
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(bodyParams);
    });
  });

  describe('generateXcmCallV2Hash', () => {
    it('should call generateXcmCall service method with correct parameters and return result', async () => {
      const bodyParams: PatchedXTransferDto = {
        from: 'Acala',
        to: 'Basilisk',
        amount: 100,
        address: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
        currency: { symbol: 'DOT' },
      };
      const mockResult = {} as Extrinsic;
      const spy = vi
        .spyOn(service, 'generateXcmCall')
        .mockResolvedValue(mockResult);

      const result = await controller.generateXcmCallV2Hash(
        bodyParams,
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(bodyParams, true);
    });
  });
});
