import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { mockRequestObject } from '../testUtils.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { XcmAnalyserController } from './xcm-analyser.controller.js';
import { XcmAnalyserService } from './xcm-analyser.service.js';
import { type XcmAnalyserDto } from './dto/xcm-analyser.dto.js';

describe('XcmAnalyserController', () => {
  let controller: XcmAnalyserController;
  let service: XcmAnalyserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [XcmAnalyserController],
      providers: [
        XcmAnalyserService,
        {
          provide: AnalyticsService,
          useValue: { get: () => '', track: vi.fn() },
        },
      ],
    }).compile();

    controller = module.get<XcmAnalyserController>(XcmAnalyserController);
    service = module.get<XcmAnalyserService>(XcmAnalyserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMultiLocationPaths', () => {
    it('should call analyticsService and xcmAnalyserService', () => {
      const bodyParams: XcmAnalyserDto = {
        multilocation: {
          parents: 1,
          interior: {
            X1: {
              Parachain: 200,
            },
          },
        },
      };
      const req = mockRequestObject;

      const xcmAnalyserServiceSpy = vi.spyOn(service, 'getMultiLocationPaths');

      controller.getMultiLocationPaths(bodyParams, req);

      expect(xcmAnalyserServiceSpy).toHaveBeenCalledWith(bodyParams);
    });

    it('should return the value from xcmAnalyserService', () => {
      const bodyParams: XcmAnalyserDto = {
        multilocation: {
          parents: 1,
          interior: {
            X1: {
              Parachain: 200,
            },
          },
        },
      };
      const req = mockRequestObject;
      const mockResponse = ['path1', 'path2'];

      vi.spyOn(service, 'getMultiLocationPaths').mockReturnValue(mockResponse);

      const result = controller.getMultiLocationPaths(bodyParams, req);

      expect(result).toBe(mockResponse);
    });
  });
});
