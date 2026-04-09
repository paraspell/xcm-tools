import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  type TAssetInfo,
  type TChain,
  type TChainAssetsInfo,
} from '@paraspell/sdk';
import * as paraspellSdk from '@paraspell/sdk';
import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AssetsService } from './assets.service.js';

vi.mock('@paraspell/sdk', async (importActual) => ({
  ...(await importActual()),
  getTChain: vi.fn().mockImplementation(() => 'Acala'),
}));

describe('AssetsService', () => {
  let service: AssetsService;
  const chain: TChain = 'Acala';
  const symbol = 'DOT';
  const unknownSymbol = 'UNKNOWN';
  const assetId = '1';
  const decimals = 12;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetsService],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAssetsObject', () => {
    let getAssetsObjectSpy: MockInstance;

    beforeEach(() => {
      getAssetsObjectSpy = vi.spyOn(paraspellSdk, 'getAssetsObject');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return assets object for a valid chain', () => {
      const assetsObject: TChainAssetsInfo = {
        relaychainSymbol: symbol,
        nativeAssetSymbol: 'DOT',
        isEVM: false,
        ss58Prefix: 42,
        supportsDryRunApi: false,
        supportsXcmPaymentApi: true,
        assets: [
          {
            symbol,
            decimals,
            isNative: true,
            location: { parents: 0, interior: 'Here' },
          },
          {
            assetId,
            symbol: 'BSK',
            decimals,
            location: { parents: 1, interior: 'Here' },
          },
        ],
      };

      getAssetsObjectSpy.mockImplementation(() => assetsObject);

      const result = service.getAssetsObject(chain);
      expect(result).toEqual(assetsObject);
      expect(getAssetsObjectSpy).toHaveBeenCalledWith(chain);
    });
  });

  describe('getAssetId', () => {
    let getAssetIdSpy: MockInstance;

    beforeEach(() => {
      getAssetIdSpy = vi.spyOn(paraspellSdk, 'getAssetId');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return asset ID for a valid chain and symbol', () => {
      getAssetIdSpy.mockReturnValue(assetId);

      const result = service.getAssetId(chain, symbol);

      expect(result).toEqual(assetId);
      expect(getAssetIdSpy).toHaveBeenCalledWith(chain, symbol);
    });

    it('should throw NotFoundException for unknown symbol', () => {
      getAssetIdSpy.mockReturnValue(null);

      expect(() => service.getAssetId(chain, unknownSymbol)).toThrow(
        NotFoundException,
      );
      expect(getAssetIdSpy).toHaveBeenCalledWith(chain, unknownSymbol);
    });
  });

  describe('getAssetLocation', () => {
    let getAssetLocationSpy: MockInstance;

    beforeEach(() => {
      getAssetLocationSpy = vi.spyOn(paraspellSdk, 'getAssetLocation');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return asset location for a valid chain and symbol', () => {
      const assetLocation = { currency: { symbol } };
      getAssetLocationSpy.mockReturnValue(assetLocation);

      const result = service.getAssetLocation(chain, {
        currency: { symbol },
      });

      expect(result).toEqual(JSON.stringify(assetLocation));
      expect(getAssetLocationSpy).toHaveBeenCalledWith(chain, { symbol });
    });
  });

  describe('getAssetInfo', () => {
    let getAssetInfoSpy: MockInstance;

    beforeEach(() => {
      getAssetInfoSpy = vi.spyOn(paraspellSdk, 'findAssetInfo');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return asset info for a valid chain and symbol', () => {
      const assetInfo = {
        assetId: '1234',
        symbol: 'DOT',
        decimals: 10,
        isNative: false,
      } as TAssetInfo;
      getAssetInfoSpy.mockReturnValue(assetInfo);

      const result = service.getAssetInfo(chain, { currency: { symbol } });

      expect(result).toEqual(JSON.stringify(assetInfo));
      expect(getAssetInfoSpy).toHaveBeenCalledWith(
        chain,
        { symbol },
        undefined,
      );
    });

    it('should return asset info for a valid chain, symbol and destination', () => {
      const assetInfo = {
        assetId: '1234',
        symbol: 'DOT',
        decimals: 10,
        isNative: false,
      } as TAssetInfo;
      getAssetInfoSpy.mockReturnValue(assetInfo);

      const destination = 'Karura';

      const result = service.getAssetInfo(chain, {
        currency: { symbol },
        destination,
      });

      expect(result).toEqual(JSON.stringify(assetInfo));
      expect(getAssetInfoSpy).toHaveBeenCalledWith(
        chain,
        { symbol },
        destination,
      );
    });
  });

  describe('getRelayChainSymbol', () => {
    let getRelayChainSymbolSpy: MockInstance;

    beforeEach(() => {
      getRelayChainSymbolSpy = vi.spyOn(paraspellSdk, 'getRelayChainSymbol');
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it('should return relay chain symbol for a valid chain', () => {
      const relayChainSymbol = 'KSM';
      getRelayChainSymbolSpy.mockReturnValue(relayChainSymbol);

      const result = service.getRelayChainSymbol(chain);

      expect(result).toEqual(JSON.stringify(relayChainSymbol));
      expect(getRelayChainSymbolSpy).toHaveBeenCalledWith(chain);
    });
  });

  describe('getNativeAssets', () => {
    let getNativeAssetsSpy: MockInstance;

    beforeEach(() => {
      getNativeAssetsSpy = vi.spyOn(paraspellSdk, 'getNativeAssets');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return native assets for a valid chain', () => {
      const nativeAssets = [{ symbol: 'KSM', decimals }];
      getNativeAssetsSpy.mockReturnValue(nativeAssets);

      const result = service.getNativeAssets(chain);

      expect(result).toEqual(nativeAssets);
      expect(getNativeAssetsSpy).toHaveBeenCalledWith(chain);
    });
  });

  describe('getOtherAssets', () => {
    let getOtherAssetsSpy: MockInstance;

    beforeEach(() => {
      getOtherAssetsSpy = vi.spyOn(paraspellSdk, 'getOtherAssets');
    });

    afterEach(() => {
      getOtherAssetsSpy.mockRestore();
    });

    it('should return other assets for a valid chain', () => {
      const otherAssets = [{ assetId, symbol: 'BSK', decimals }];
      getOtherAssetsSpy.mockReturnValue(otherAssets);

      const result = service.getOtherAssets(chain);

      expect(result).toEqual(otherAssets);
      expect(getOtherAssetsSpy).toHaveBeenCalledWith(chain);
    });
  });

  describe('getAllAssetsSymbols', () => {
    let getAllAssetsSymbolsSpy: MockInstance;

    beforeEach(() => {
      getAllAssetsSymbolsSpy = vi.spyOn(paraspellSdk, 'getAllAssetsSymbols');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return all assets symbols for a valid chain', () => {
      const allAssetSymbols = ['KSM', 'DOT'];
      getAllAssetsSymbolsSpy.mockReturnValue(allAssetSymbols);

      const result = service.getAllAssetsSymbols(chain);

      expect(result).toEqual(allAssetSymbols);
      expect(getAllAssetsSymbolsSpy).toHaveBeenCalledWith(chain);
    });
  });

  describe('getDecimals', () => {
    let getAssetDecimalsSpy: MockInstance;

    beforeEach(() => {
      getAssetDecimalsSpy = vi.spyOn(paraspellSdk, 'getAssetDecimals');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return asset decimals for a valid chain and symbol', () => {
      const chain = 'Acala';
      const symbol = 'DOT';
      const decimals = 18;
      getAssetDecimalsSpy.mockReturnValue(decimals);

      const result = service.getDecimals(chain, symbol);

      expect(result).toEqual(decimals);
      expect(getAssetDecimalsSpy).toHaveBeenCalledWith(chain, symbol);
    });

    it('should throw NotFoundException for unknown symbol', () => {
      getAssetDecimalsSpy.mockReturnValue(null);

      expect(() => service.getDecimals(chain, unknownSymbol)).toThrow(
        NotFoundException,
      );
      expect(getAssetDecimalsSpy).toHaveBeenCalledWith(chain, unknownSymbol);
    });
  });

  describe('hasSupportForAsset', () => {
    let hasSupportForAssetSpy: MockInstance;

    beforeEach(() => {
      hasSupportForAssetSpy = vi.spyOn(paraspellSdk, 'hasSupportForAsset');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return true if asset is supported for a valid chain and symbol', () => {
      hasSupportForAssetSpy.mockReturnValue(true);

      const result = service.hasSupportForAsset(chain, symbol);

      expect(result).toEqual(true);
      expect(hasSupportForAssetSpy).toHaveBeenCalledWith(chain, symbol);
    });

    it('should return false if asset is not supported for a valid chain and symbol', () => {
      hasSupportForAssetSpy.mockReturnValue(false);

      const result = service.hasSupportForAsset(chain, unknownSymbol);

      expect(result).toEqual(false);
      expect(hasSupportForAssetSpy).toHaveBeenCalledWith(chain, unknownSymbol);
    });
  });

  describe('getSupportedAssets', () => {
    let getSupportedAssetsSpy: MockInstance;

    beforeEach(() => {
      getSupportedAssetsSpy = vi.spyOn(paraspellSdk, 'getSupportedAssets');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return supported assets for a valid origin and destination chain', () => {
      const supportedAssets = [{ symbol: 'DOT', decimals }];
      getSupportedAssetsSpy.mockReturnValue(supportedAssets);

      const originChain = 'Acala';
      const destChain = 'Karura';

      const result = service.getSupportedAssets(originChain, destChain);

      expect(result).toEqual(supportedAssets);
      expect(getSupportedAssetsSpy).toHaveBeenCalledWith(
        originChain,
        destChain,
      );
    });
  });

  describe('getSupportedDEstinations', () => {
    let getSupportedDestinationsSpy: MockInstance;

    beforeEach(() => {
      getSupportedDestinationsSpy = vi.spyOn(
        paraspellSdk,
        'getSupportedDestinations',
      );
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return supported destinations for a valid chain', () => {
      const chain = 'Acala';
      const supportedDestinations = ['Karura', 'Moonbeam'];
      getSupportedDestinationsSpy.mockReturnValue(supportedDestinations);
      const result = service.getSupportedDestinations(chain, {
        currency: { symbol: 'KSM' },
      });
      expect(result).toEqual(supportedDestinations);
      expect(getSupportedDestinationsSpy).toHaveBeenCalledWith(chain, {
        symbol: 'KSM',
      });
    });
  });

  describe('getAssetReserveChain', () => {
    let findAssetInfoOrThrowSpy: MockInstance;
    let getAssetReserveChainSpy: MockInstance;

    beforeEach(() => {
      findAssetInfoOrThrowSpy = vi.spyOn(paraspellSdk, 'findAssetInfoOrThrow');
      getAssetReserveChainSpy = vi.spyOn(paraspellSdk, 'getAssetReserveChain');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should return reserve chain for a valid chain and currency', () => {
      const location = { parents: 1, interior: { X1: { Parachain: 1000 } } };
      findAssetInfoOrThrowSpy.mockReturnValue({
        symbol: 'DOT',
        decimals: 10,
        location,
      });
      getAssetReserveChainSpy.mockReturnValue('AssetHubPolkadot');

      const result = service.getAssetReserveChain(chain, {
        currency: { symbol },
      });

      expect(result).toBe('AssetHubPolkadot');
      expect(findAssetInfoOrThrowSpy).toHaveBeenCalledWith(chain, { symbol });
      expect(getAssetReserveChainSpy).toHaveBeenCalledWith(chain, location);
    });

    it('should call handleXcmApiError when findAssetInfoOrThrow throws', () => {
      findAssetInfoOrThrowSpy.mockImplementation(() => {
        throw new paraspellSdk.InvalidCurrencyError('Asset not found');
      });

      expect(() =>
        service.getAssetReserveChain(chain, {
          currency: { symbol: 'UNKNOWN' },
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('getFeeAssets', () => {
    it('should return fee assets for a valid chain', () => {
      const chain = 'Acala';
      const feeAssets = [
        { symbol: 'KSM', decimals },
      ] as paraspellSdk.TAssetInfo[];
      const getFeeAssetsSpy = vi
        .spyOn(paraspellSdk, 'getFeeAssets')
        .mockReturnValue(feeAssets);

      const result = service.getFeeAssets(chain);

      expect(result).toEqual(feeAssets);
      expect(getFeeAssetsSpy).toHaveBeenCalledWith(chain);
    });
  });
});
