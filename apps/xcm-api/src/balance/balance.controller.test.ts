import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { BalanceController } from './balance.controller.js';
import { BalanceService } from './balance.service.js';
import type { BalanceForeignDto } from './dto/BalanceForeignDto.js';
import type { BalanceNativeDto } from './dto/BalanceNativeDto.js';
import type { ExistentialDepositDto } from './dto/ExistentialDepositDto.js';

describe('BalanceController', () => {
  let controller: BalanceController;
  let service: BalanceService;
  let analyticsService: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BalanceController],
      providers: [
        {
          provide: BalanceService,
          useValue: {
            getBalance: vi.fn(),
            getExistentialDeposit: vi.fn(),
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

    controller = module.get<BalanceController>(BalanceController);
    service = module.get<BalanceService>(BalanceService);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('getBalance', () => {
    it('should track analytics and call BalanceService for asset balance', async () => {
      const chain = 'Acala';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const req = {} as Request;

      const balanceForeignMock = '500';
      const balanceServiceSpy = vi
        .spyOn(service, 'getBalance')
        .mockResolvedValue(balanceForeignMock);
      const analyticsServiceSpy = vi.spyOn(analyticsService, 'track');

      const result = await controller.getBalance(chain, params, req);

      expect(analyticsServiceSpy).toHaveBeenCalledWith(
        EventName.GET_ASSET_BALANCE,
        req,
        { chain },
      );
      expect(balanceServiceSpy).toHaveBeenCalledWith(chain, params);
      expect(result).toEqual(balanceForeignMock);
    });
  });

  describe('getExistentialDeposit', () => {
    it('should track analytics and call BalanceService for existential deposit', () => {
      const chain = 'Acala';
      const params: ExistentialDepositDto = {
        currency: { symbol: 'DOT' },
      };
      const req = {} as Request;

      const edMock = 1000000000n;
      const balanceServiceSpy = vi
        .spyOn(service, 'getExistentialDeposit')
        .mockReturnValue(edMock);
      const analyticsServiceSpy = vi.spyOn(analyticsService, 'track');

      const result = controller.getExistentialDeposit(chain, params, req);

      expect(analyticsServiceSpy).toHaveBeenCalledWith(
        EventName.GET_EXISTENTIAL_DEPOSIT,
        req,
        { chain },
      );
      expect(balanceServiceSpy).toHaveBeenCalledWith(chain, params);
      expect(result).toEqual(edMock);
    });
  });
});
