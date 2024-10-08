import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { BalanceController } from './balance.controller.js';
import { BalanceService } from './balance.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import type { BalanceNativeDto } from './dto/BalanceNativeDto.js';
import type { BalanceForeignDto } from './dto/BalanceForeignDto.js';

describe('BalanceController', () => {
  let balanceController: BalanceController;
  let balanceService: BalanceService;
  let analyticsService: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BalanceController],
      providers: [
        {
          provide: BalanceService,
          useValue: {
            getBalanceNative: vi.fn(),
            getBalanceForeign: vi.fn(),
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            track: vi.fn(),
          },
        },
      ],
    }).compile();

    balanceController = module.get<BalanceController>(BalanceController);
    balanceService = module.get<BalanceService>(BalanceService);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('getBalanceNative', () => {
    it('should track analytics and call BalanceService for native balance', async () => {
      const node = 'Acala';
      const params: BalanceNativeDto = {
        address: '0x1234567890',
      };
      const req = {} as Request;

      const balanceNativeMock = 1000n;
      const balanceServiceSpy = vi
        .spyOn(balanceService, 'getBalanceNative')
        .mockResolvedValue(balanceNativeMock);
      const analyticsServiceSpy = vi.spyOn(analyticsService, 'track');

      const result = await balanceController.getBalanceNative(
        node,
        params,
        req,
      );

      expect(analyticsServiceSpy).toHaveBeenCalledWith(
        EventName.GET_BALANCE_NATIVE,
        req,
        { node },
      );
      expect(balanceServiceSpy).toHaveBeenCalledWith(node, params);
      expect(result).toEqual(balanceNativeMock);
    });
  });

  describe('getBalanceForeign', () => {
    it('should track analytics and call BalanceService for foreign balance', async () => {
      const node = 'Acala';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const req = {} as Request;

      const balanceForeignMock = '500';
      const balanceServiceSpy = vi
        .spyOn(balanceService, 'getBalanceForeign')
        .mockResolvedValue(balanceForeignMock);
      const analyticsServiceSpy = vi.spyOn(analyticsService, 'track');

      const result = await balanceController.getBalanceForeign(
        node,
        params,
        req,
      );

      expect(analyticsServiceSpy).toHaveBeenCalledWith(
        EventName.GET_BALANCE_FOREIGN,
        req,
        { node },
      );
      expect(balanceServiceSpy).toHaveBeenCalledWith(node, params);
      expect(result).toEqual(balanceForeignMock);
    });
  });
});
