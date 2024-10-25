import { vi, describe, beforeEach, it, expect } from 'vitest';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AssetsController } from './assets.controller.js';
import { AssetsService } from './assets.service.js';
import type { TNode, TNodeAssets } from '@paraspell/sdk';
import { NODE_NAMES } from '@paraspell/sdk';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { mockRequestObject } from '../testUtils.js';

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

  describe('getNodeNames', () => {
    it('should return the list of node names', () => {
      const mockResult = NODE_NAMES;
      const spy = vi
        .spyOn(assetsService, 'getNodeNames')
        .mockReturnValue(mockResult);

      const result = controller.getNodeNames(mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getAssetsObject', () => {
    const mockResult = {
      paraId: 2009,
      relayChainAssetSymbol: 'KSM',
      nativeAssets: [{ symbol, decimals }],
      otherAssets: [{ assetId: '234123123', symbol: 'FKK', decimals }],
      nativeAssetSymbol: symbol,
    } as TNodeAssets;
    it('should return assets object for a valid node', () => {
      const spy = vi
        .spyOn(assetsService, 'getAssetsObject')
        .mockReturnValue(mockResult);

      const result = controller.getAssetsObject(
        node,
        'polkadot',
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(node);
    });

    it('should return assets object for a valid parachain id', () => {
      const paraId = '2009';
      const spy = vi
        .spyOn(assetsService, 'getNodeByParaId')
        .mockReturnValue(paraId);

      const result = controller.getAssetsObject(
        paraId,
        'polkadot',
        mockRequestObject,
      );

      expect(result).toBe(paraId);
      expect(spy).toHaveBeenCalledWith(Number(paraId), 'polkadot');
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
      const mockResult = [{ symbol, decimals }];
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

  describe('getParaId', () => {
    it('should return parachain id for a valid node', () => {
      const mockResult = 2009;
      const spy = vi
        .spyOn(assetsService, 'getParaId')
        .mockReturnValue(mockResult);

      const result = controller.getParaId(node, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(node);
    });
  });
});
