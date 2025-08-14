import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type {
  TAssetInfo,
  TChain,
  TChainAssetsInfo,
  TNativeAssetInfo,
} from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { mockRequestObject } from '../testUtils.js';
import { AssetsController } from './assets.controller.js';
import { AssetsService } from './assets.service.js';
import type { OriginFeeDetailsDto } from './dto/OriginFeeDetailsDto.js';

// Integration tests to ensure controller and service are working together
describe('AssetsController', () => {
  let controller: AssetsController;
  let assetsService: AssetsService;
  const chain: TChain = 'Acala';
  const symbol = 'KSM';
  const decimals = 18;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [
        AssetsService,
        {
          provide: AnalyticsService,
          useValue: { get: () => '', track: vi.fn() },
        },
      ],
    }).compile();

    controller = module.get<AssetsController>(AssetsController);
    assetsService = module.get<AssetsService>(AssetsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAssetsObject', () => {
    const mockResult = {
      paraId: 2009,
      relaychainSymbol: 'KSM',
      isEVM: false,
      ss58Prefix: 42,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      nativeAssets: [{ symbol, decimals, isNative: true }],
      otherAssets: [{ assetId: '234123123', symbol: 'FKK', decimals }],
      nativeAssetSymbol: symbol,
    } as TChainAssetsInfo;
    it('should return assets object for a valid chain', () => {
      const spy = vi
        .spyOn(assetsService, 'getAssetsObject')
        .mockReturnValue(mockResult);

      const result = controller.getAssetsObject(chain, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(chain);
    });
  });

  describe('getAssetId', () => {
    it('should return asset ID for a valid chain and symbol', () => {
      const symbol = 'DOT';
      const mockResult = '1';
      const spy = vi
        .spyOn(assetsService, 'getAssetId')
        .mockReturnValue(mockResult);

      const result = controller.getAssetId(
        chain,
        { symbol },
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(chain, symbol);
    });
  });

  describe('getAssetLocation', () => {
    it('should return asset location for a valid chain and symbol', () => {
      const mockResult = JSON.stringify({ currency: { symbol } });
      const spy = vi
        .spyOn(assetsService, 'getAssetLocation')
        .mockReturnValue(mockResult);

      const result = controller.getAssetLocation(
        chain,
        { currency: { symbol } },
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(chain, { currency: { symbol } });
    });
  });

  describe('getRelayChainSymbol', () => {
    it('should return relay chain symbol for a valid chain', () => {
      const mockResult = 'KSM';
      const spy = vi
        .spyOn(assetsService, 'getRelayChainSymbol')
        .mockReturnValue(mockResult);

      const result = controller.getRelayChainSymbol(chain, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(chain);
    });
  });

  describe('getNativeAssets', () => {
    it('should return native assets for a valid chain', () => {
      const mockResult = [
        { symbol, decimals, isNative: true },
      ] as TNativeAssetInfo[];
      const spy = vi
        .spyOn(assetsService, 'getNativeAssets')
        .mockReturnValue(mockResult);

      const result = controller.getNativeAssets(chain, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(chain);
    });
  });

  describe('getOtherAssets', () => {
    it('should return other assets for a valid chain', () => {
      const mockResult = [{ assetId: '234123123', symbol: 'FKK', decimals }];
      const spy = vi
        .spyOn(assetsService, 'getOtherAssets')
        .mockReturnValue(mockResult);

      const result = controller.getOtherAssets(chain, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(chain);
    });
  });

  describe('getAllAssetsSymbol', () => {
    it('should return all assets symbols for a valid chain', () => {
      const mockResult = [symbol, 'DOT'];
      const spy = vi
        .spyOn(assetsService, 'getAllAssetsSymbols')
        .mockReturnValue(mockResult);

      const result = controller.getAllAssetsSymbol(chain, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(chain);
    });
  });

  describe('getDecimals', () => {
    it('should return decimals for a valid chain and symbol', () => {
      const mockResult = 18;
      const spy = vi
        .spyOn(assetsService, 'getDecimals')
        .mockReturnValue(mockResult);

      const result = controller.getDecimals(
        chain,
        { symbol },
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(chain, symbol);
    });
  });

  describe('hasSupportForAsset', () => {
    it('should return true if asset is supported for a valid chain and symbol', () => {
      const mockResult = true;
      const spy = vi
        .spyOn(assetsService, 'hasSupportForAsset')
        .mockReturnValue(mockResult);

      const result = controller.hasSupportForAsset(
        chain,
        { symbol },
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(chain, symbol);
    });
  });

  describe('getSupportedAssets', () => {
    it('should return supported assets for a valid chain origin and destination', () => {
      const originChain = 'Acala';
      const destChain = 'Karura';
      const mockResult = [
        {
          symbol: 'DOT',
          assetId: '1234',
        },
      ] as TAssetInfo[];
      const spy = vi
        .spyOn(assetsService, 'getSupportedAssets')
        .mockReturnValue(mockResult);

      const result = controller.getSupportedAssets(
        { origin: originChain, destination: destChain },
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(originChain, destChain);
    });
  });

  describe('getSupportedDestinations', () => {
    it('should return supported destinations for a valid chain and parameters', () => {
      const chain: TChain = 'Acala';
      const params = { currency: { symbol: 'KSM' } };
      const mockResult: TChain[] = ['Moonbeam', 'Hydration'];
      const spy = vi
        .spyOn(assetsService, 'getSupportedDestinations')
        .mockReturnValue(mockResult);
      const result = controller.getSupportedDestinations(
        chain,
        params,
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(chain, params);
    });
  });

  describe('getOriginFeeDetails', () => {
    it('should return origin fee details for a valid origin and destination', async () => {
      const origin = 'Acala';
      const destination = 'Karura';
      const mockResult = {
        sufficientForXCM: true,
        xcmFee: 100n,
      };
      const spy = vi
        .spyOn(assetsService, 'getOriginFeeDetails')
        .mockResolvedValue(mockResult);

      const result = await controller.getOriginFeeDetails(
        { origin, destination } as OriginFeeDetailsDto,
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith({ origin, destination });
    });
  });

  describe('getFeeAssets', () => {
    it('should return fee assets for a valid chain', () => {
      const mockResult = [
        { symbol, decimals, isNative: true },
      ] as TNativeAssetInfo[];
      const spy = vi
        .spyOn(assetsService, 'getFeeAssets')
        .mockReturnValue(mockResult);

      const result = controller.getFeeAssets(chain, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(chain);
    });
  });
});
