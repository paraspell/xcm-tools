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
import type { VerifyEdOnDestDto } from './dto/VerifyEdOnDestDto.js';

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
            getAssetBalance: vi.fn(),
            getMaxForeignTransferableAmount: vi.fn(),
            getMaxNativeTransferableAmount: vi.fn(),
            getTransferableAmount: vi.fn(),
            getExistentialDeposit: vi.fn(),
            verifyEdOnDestination: vi.fn(),
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

  describe('getAssetBalance', () => {
    it('should track analytics and call BalanceService for asset balance', async () => {
      const node = 'Acala';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const req = {} as Request;

      const balanceForeignMock = '500';
      const balanceServiceSpy = vi
        .spyOn(balanceService, 'getAssetBalance')
        .mockResolvedValue(balanceForeignMock);
      const analyticsServiceSpy = vi.spyOn(analyticsService, 'track');

      const result = await balanceController.getAssetBalance(node, params, req);

      expect(analyticsServiceSpy).toHaveBeenCalledWith(
        EventName.GET_ASSET_BALANCE,
        req,
        { node },
      );
      expect(balanceServiceSpy).toHaveBeenCalledWith(node, params);
      expect(result).toEqual(balanceForeignMock);
    });
  });

  describe('getMaxForeignTransferableAmount', () => {
    it('should track analytics and call BalanceService for max foreign transferable amount', async () => {
      const node = 'Acala';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const req = {} as Request;

      const maxForeignAmountMock = 10000n;
      const balanceServiceSpy = vi
        .spyOn(balanceService, 'getMaxForeignTransferableAmount')
        .mockResolvedValue(maxForeignAmountMock);
      const analyticsServiceSpy = vi.spyOn(analyticsService, 'track');

      const result = await balanceController.getMaxForeignTransferableAmount(
        node,
        params,
        req,
      );

      expect(analyticsServiceSpy).toHaveBeenCalledWith(
        EventName.GET_MAX_FOREIGN_TRANSFERABLE_AMOUNT,
        req,
        { node },
      );
      expect(balanceServiceSpy).toHaveBeenCalledWith(node, params);
      expect(result).toEqual(maxForeignAmountMock);
    });
  });

  describe('getMaxNativeTransferableAmount', () => {
    it('should track analytics and call BalanceService for max native transferable amount', async () => {
      const node = 'Acala';
      const params: BalanceNativeDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const req = {} as Request;

      const maxNativeAmountMock = 20000n;
      const balanceServiceSpy = vi
        .spyOn(balanceService, 'getMaxNativeTransferableAmount')
        .mockResolvedValue(maxNativeAmountMock);
      const analyticsServiceSpy = vi.spyOn(analyticsService, 'track');

      const result = await balanceController.getMaxNativeTransferableAmount(
        node,
        params,
        req,
      );

      expect(analyticsServiceSpy).toHaveBeenCalledWith(
        EventName.GET_MAX_FOREIGN_TRANSFERABLE_AMOUNT, // event name matches the code snippet
        req,
        { node },
      );
      expect(balanceServiceSpy).toHaveBeenCalledWith(node, params);
      expect(result).toEqual(maxNativeAmountMock);
    });
  });

  describe('getTransferableAmount', () => {
    it('should track analytics and call BalanceService for transferable amount', async () => {
      const node = 'Acala';
      const params: BalanceForeignDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ' },
      };
      const req = {} as Request;

      const amountMock = 20000n;
      const balanceServiceSpy = vi
        .spyOn(balanceService, 'getTransferableAmount')
        .mockResolvedValue(amountMock);
      const analyticsServiceSpy = vi.spyOn(analyticsService, 'track');

      const result = await balanceController.getTransferableAmount(
        node,
        params,
        req,
      );

      expect(analyticsServiceSpy).toHaveBeenCalledWith(
        EventName.GET_TRANSFERABLE_AMOUNT,
        req,
        { node },
      );
      expect(balanceServiceSpy).toHaveBeenCalledWith(node, params);
      expect(result).toEqual(amountMock);
    });
  });

  describe('getExistentialDeposit', () => {
    it('should track analytics and call BalanceService for existential deposit', () => {
      const node = 'Acala';
      const params: ExistentialDepositDto = {
        currency: { symbol: 'DOT' },
      };
      const req = {} as Request;

      const edMock = '1000000000';
      const balanceServiceSpy = vi
        .spyOn(balanceService, 'getExistentialDeposit')
        .mockReturnValue(edMock);
      const analyticsServiceSpy = vi.spyOn(analyticsService, 'track');

      const result = balanceController.getExistentialDeposit(node, params, req);

      expect(analyticsServiceSpy).toHaveBeenCalledWith(
        EventName.GET_EXISTENTIAL_DEPOSIT,
        req,
        { node },
      );
      expect(balanceServiceSpy).toHaveBeenCalledWith(node, params);
      expect(result).toEqual(edMock);
    });
  });

  describe('verifyEdOnDestination', () => {
    it('should track analytics and call BalanceService for verifying ED on destination', async () => {
      const node = 'Acala';
      const params: VerifyEdOnDestDto = {
        address: '0x1234567890',
        currency: { symbol: 'UNQ', amount: '100' },
      };
      const req = {} as Request;

      const resultMock = true;
      const balanceServiceSpy = vi
        .spyOn(balanceService, 'verifyEdOnDestination')
        .mockResolvedValue(resultMock);
      const analyticsServiceSpy = vi.spyOn(analyticsService, 'track');

      const result = await balanceController.verifyEdOnDestination(
        node,
        params,
        req,
      );

      expect(analyticsServiceSpy).toHaveBeenCalledWith(
        EventName.VERIFY_ED_ON_DESTINATION,
        req,
        { node },
      );
      expect(balanceServiceSpy).toHaveBeenCalledWith(node, params);
      expect(result).toEqual(resultMock);
    });
  });
});
