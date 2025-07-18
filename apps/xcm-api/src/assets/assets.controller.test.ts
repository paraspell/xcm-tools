import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type {
  TAsset,
  TNativeAsset,
  TNode,
  TNodeAssets,
  TNodeWithRelayChains,
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
  const node: TNode = 'Acala';
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
      relayChainAssetSymbol: 'KSM',
      isEVM: false,
      ss58Prefix: 42,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: true,
      nativeAssets: [{ symbol, decimals, isNative: true }],
      otherAssets: [{ assetId: '234123123', symbol: 'FKK', decimals }],
      nativeAssetSymbol: symbol,
    } as TNodeAssets;
    it('should return assets object for a valid node', () => {
      const spy = vi
        .spyOn(assetsService, 'getAssetsObject')
        .mockReturnValue(mockResult);

      const result = controller.getAssetsObject(node, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(node);
    });
  });

  describe('getAssetId', () => {
    it('should return asset ID for a valid node and symbol', () => {
      const symbol = 'DOT';
      const mockResult = '1';
      const spy = vi
        .spyOn(assetsService, 'getAssetId')
        .mockReturnValue(mockResult);

      const result = controller.getAssetId(node, { symbol }, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(node, symbol);
    });
  });

  describe('getAssetMultiLocation', () => {
    it('should return asset multi location for a valid node and symbol', () => {
      const mockResult = JSON.stringify({ currency: { symbol } });
      const spy = vi
        .spyOn(assetsService, 'getAssetMultiLocation')
        .mockReturnValue(mockResult);

      const result = controller.getAssetMultiLocation(
        node,
        { currency: { symbol } },
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(node, { currency: { symbol } });
    });
  });

  describe('getRelayChainSymbol', () => {
    it('should return relay chain symbol for a valid node', () => {
      const mockResult = 'KSM';
      const spy = vi
        .spyOn(assetsService, 'getRelayChainSymbol')
        .mockReturnValue(mockResult);

      const result = controller.getRelayChainSymbol(node, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(node);
    });
  });

  describe('getNativeAssets', () => {
    it('should return native assets for a valid node', () => {
      const mockResult = [
        { symbol, decimals, isNative: true },
      ] as TNativeAsset[];
      const spy = vi
        .spyOn(assetsService, 'getNativeAssets')
        .mockReturnValue(mockResult);

      const result = controller.getNativeAssets(node, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(node);
    });
  });

  describe('getOtherAssets', () => {
    it('should return other assets for a valid node', () => {
      const mockResult = [{ assetId: '234123123', symbol: 'FKK', decimals }];
      const spy = vi
        .spyOn(assetsService, 'getOtherAssets')
        .mockReturnValue(mockResult);

      const result = controller.getOtherAssets(node, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(node);
    });
  });

  describe('getAllAssetsSymbol', () => {
    it('should return all assets symbols for a valid node', () => {
      const mockResult = [symbol, 'DOT'];
      const spy = vi
        .spyOn(assetsService, 'getAllAssetsSymbols')
        .mockReturnValue(mockResult);

      const result = controller.getAllAssetsSymbol(node, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(node);
    });
  });

  describe('getDecimals', () => {
    it('should return decimals for a valid node and symbol', () => {
      const mockResult = 18;
      const spy = vi
        .spyOn(assetsService, 'getDecimals')
        .mockReturnValue(mockResult);

      const result = controller.getDecimals(
        node,
        { symbol },
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(node, symbol);
    });
  });

  describe('hasSupportForAsset', () => {
    it('should return true if asset is supported for a valid node and symbol', () => {
      const mockResult = true;
      const spy = vi
        .spyOn(assetsService, 'hasSupportForAsset')
        .mockReturnValue(mockResult);

      const result = controller.hasSupportForAsset(
        node,
        { symbol },
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(node, symbol);
    });
  });

  describe('getSupportedAssets', () => {
    it('should return supported assets for a valid node origin and destination', () => {
      const nodeOrigin = 'Acala';
      const nodeDestination = 'Karura';
      const mockResult = [
        {
          symbol: 'DOT',
          assetId: '1234',
        },
      ] as TAsset[];
      const spy = vi
        .spyOn(assetsService, 'getSupportedAssets')
        .mockReturnValue(mockResult);

      const result = controller.getSupportedAssets(
        { origin: nodeOrigin, destination: nodeDestination },
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(nodeOrigin, nodeDestination);
    });
  });

  describe('getSupportedDestinations', () => {
    it('should return supported destinations for a valid node and parameters', () => {
      const node: TNodeWithRelayChains = 'Acala';
      const params = { currency: { symbol: 'KSM' } };
      const mockResult: TNodeWithRelayChains[] = ['Moonbeam', 'Hydration'];
      const spy = vi
        .spyOn(assetsService, 'getSupportedDestinations')
        .mockReturnValue(mockResult);
      const result = controller.getSupportedDestinations(
        node,
        params,
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(node, params);
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
    it('should return fee assets for a valid node', () => {
      const mockResult = [
        { symbol, decimals, isNative: true },
      ] as TNativeAsset[];
      const spy = vi
        .spyOn(assetsService, 'getFeeAssets')
        .mockReturnValue(mockResult);

      const result = controller.getFeeAssets(node, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(node);
    });
  });
});
