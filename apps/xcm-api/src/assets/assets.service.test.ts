import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  CHAINS,
  InvalidAddressError,
  SUBSTRATE_CHAINS,
  type TChain,
} from '@paraspell/sdk';
import * as paraspellSdk from '@paraspell/sdk';
import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as utils from '../utils.js';
import { AssetsService } from './assets.service.js';
import type { OriginFeeDetailsDto } from './dto/OriginFeeDetailsDto.js';

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    getTChain: vi.fn().mockImplementation(() => 'Acala'),
  };
});

describe('AssetsService', () => {
  let service: AssetsService;
  const chain: TChain = 'Acala';
  const invalidChain = 'InvalidChain';
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
      const assetsObject: paraspellSdk.TChainAssetsInfo = {
        relaychainSymbol: symbol,
        nativeAssetSymbol: 'DOT',
        isEVM: false,
        ss58Prefix: 42,
        supportsDryRunApi: false,
        supportsXcmPaymentApi: true,
        nativeAssets: [
          { symbol, decimals, isNative: true },
        ] as paraspellSdk.TNativeAssetInfo[],
        otherAssets: [{ assetId, symbol: 'BSK', decimals }],
      };

      const validateChainSpy = vi.spyOn(utils, 'validateChain');

      getAssetsObjectSpy.mockImplementation(() => assetsObject);

      const result = service.getAssetsObject(chain);
      expect(result).toEqual(assetsObject);
      expect(validateChainSpy).toHaveBeenCalledWith(chain, CHAINS);
      expect(getAssetsObjectSpy).toHaveBeenCalledWith(chain);
    });

    it('should throw if chain is invalid', () => {
      const validateChainSpy = vi
        .spyOn(utils, 'validateChain')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getAssetsObject(invalidChain)).toThrow(
        BadRequestException,
      );

      expect(validateChainSpy).toHaveBeenCalledWith(invalidChain, CHAINS);
      expect(getAssetsObjectSpy).not.toHaveBeenCalled();
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

    it('should throw BadRequestException for invalid chain', () => {
      const validateChainSpy = vi
        .spyOn(utils, 'validateChain')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getAssetId(invalidChain, symbol)).toThrow(
        BadRequestException,
      );

      expect(validateChainSpy).toHaveBeenCalledWith(invalidChain, CHAINS);
      expect(getAssetIdSpy).not.toHaveBeenCalled();
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

    it('should throw BadRequestException for invalid chain', () => {
      const validateChainSpy = vi
        .spyOn(utils, 'validateChain')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() =>
        service.getAssetLocation(invalidChain, { currency: { symbol } }),
      ).toThrow(BadRequestException);

      expect(validateChainSpy).toHaveBeenCalledWith(invalidChain, CHAINS);
      expect(getAssetLocationSpy).not.toHaveBeenCalled();
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

    it('should throw BadRequestException for invalid chain', () => {
      const validateChainSpy = vi
        .spyOn(utils, 'validateChain')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getRelayChainSymbol(invalidChain)).toThrow(
        BadRequestException,
      );

      expect(validateChainSpy).toHaveBeenCalledWith(invalidChain, CHAINS);
      expect(getRelayChainSymbolSpy).not.toHaveBeenCalled();
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

    it('should throw BadRequestException for invalid chain', () => {
      const validateChainSpy = vi
        .spyOn(utils, 'validateChain')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getNativeAssets(invalidChain)).toThrow(
        BadRequestException,
      );

      expect(validateChainSpy).toHaveBeenCalledWith(invalidChain, CHAINS);
      expect(getNativeAssetsSpy).not.toHaveBeenCalled();
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

    it('should throw BadRequestException for invalid chain', () => {
      const validateChainSpy = vi
        .spyOn(utils, 'validateChain')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getOtherAssets(invalidChain)).toThrow(
        BadRequestException,
      );

      expect(validateChainSpy).toHaveBeenCalledWith(invalidChain, CHAINS);
      expect(getOtherAssetsSpy).not.toHaveBeenCalled();
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

    it('should throw BadRequestException for invalid chain', () => {
      const validateChainSpy = vi
        .spyOn(utils, 'validateChain')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getAllAssetsSymbols(invalidChain)).toThrow(
        BadRequestException,
      );

      expect(validateChainSpy).toHaveBeenCalledWith(invalidChain, CHAINS);
      expect(getAllAssetsSymbolsSpy).not.toHaveBeenCalled();
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

    it('should throw BadRequestException for invalid chain', () => {
      const validateChainSpy = vi
        .spyOn(utils, 'validateChain')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getDecimals(invalidChain, symbol)).toThrow(
        BadRequestException,
      );

      expect(validateChainSpy).toHaveBeenCalledWith(invalidChain, CHAINS);
      expect(getAssetDecimalsSpy).not.toHaveBeenCalled();
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

    it('should throw BadRequestException for invalid chain', () => {
      const validateChainSpy = vi
        .spyOn(utils, 'validateChain')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.hasSupportForAsset(invalidChain, symbol)).toThrow(
        BadRequestException,
      );

      expect(validateChainSpy).toHaveBeenCalledWith(invalidChain, CHAINS);
      expect(hasSupportForAssetSpy).not.toHaveBeenCalled();
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

    it('should throw BadRequestException for invalid origin chain', () => {
      const validateChainSpy = vi
        .spyOn(utils, 'validateChain')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      const originChain = 'InvalidChain';
      const destChain = 'Karura';

      expect(() => service.getSupportedAssets(originChain, destChain)).toThrow(
        BadRequestException,
      );

      expect(validateChainSpy).toHaveBeenCalledWith(originChain, CHAINS);
      expect(getSupportedAssetsSpy).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid destination chain', () => {
      const validateChainSpy = vi
        .spyOn(utils, 'validateChain')
        .mockImplementation((chain: string) => {
          if (chain === 'Acala') {
            return;
          }
          throw new BadRequestException();
        });

      const originChain = 'Acala';
      const destChain = 'InvalidChain';

      expect(() => service.getSupportedAssets(originChain, destChain)).toThrow(
        BadRequestException,
      );

      expect(validateChainSpy).toHaveBeenCalledWith(originChain, CHAINS);
      expect(validateChainSpy).toHaveBeenCalledWith(destChain, CHAINS);
      expect(getSupportedAssetsSpy).not.toHaveBeenCalled();
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

  describe('getOriginFeeDetails', () => {
    it('should return origin fee details for a valid origin and destination chain', async () => {
      const originChain = 'Acala';
      const destChain = 'Karura';

      const getOriginFeeDetailsSpy = vi
        .spyOn(paraspellSdk, 'getOriginFeeDetails')
        .mockResolvedValue({ xcmFee: 1n, sufficientForXCM: true });

      const validateChainSpy = vi.spyOn(utils, 'validateChain');

      const result = await service.getOriginFeeDetails({
        origin: originChain,
        destination: destChain,
      } as OriginFeeDetailsDto);

      expect(result).toEqual({ xcmFee: 1n, sufficientForXCM: true });
      expect(validateChainSpy).toHaveBeenCalledWith(
        originChain,
        SUBSTRATE_CHAINS,
      );
      expect(validateChainSpy).toHaveBeenCalledWith(destChain, CHAINS);
      expect(getOriginFeeDetailsSpy).toHaveBeenCalledWith({
        origin: originChain,
        destination: destChain,
      });
    });

    it('should throw BadRequestException for invalid origin chain', async () => {
      const originChain = 'InvalidChain';
      const destChain = 'Karura';

      const validateChainSpy = vi
        .spyOn(utils, 'validateChain')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      await expect(
        service.getOriginFeeDetails({
          origin: originChain,
          destination: destChain,
        } as OriginFeeDetailsDto),
      ).rejects.toThrow(BadRequestException);

      expect(validateChainSpy).toHaveBeenCalledWith(
        originChain,
        SUBSTRATE_CHAINS,
      );
    });

    it('should throw BadRequestException for invalid destination chain', async () => {
      const originChain = 'Acala';
      const destChain = 'InvalidChain';

      const validateChainSpy = vi
        .spyOn(utils, 'validateChain')
        .mockImplementation((chain: string) => {
          if (chain === 'Acala') {
            return;
          }
          throw new BadRequestException();
        });

      await expect(
        service.getOriginFeeDetails({
          origin: originChain,
          destination: destChain,
        } as OriginFeeDetailsDto),
      ).rejects.toThrow(BadRequestException);

      expect(validateChainSpy).toHaveBeenCalledWith(
        originChain,
        SUBSTRATE_CHAINS,
      );
      expect(validateChainSpy).toHaveBeenCalledWith(destChain, CHAINS);
    });

    it('should throw a BadRequestException if an error occurs inside SDK', async () => {
      const originChain = 'Acala';
      const destChain = 'Karura';

      const getOriginFeeDetailsSpy = vi
        .spyOn(paraspellSdk, 'getOriginFeeDetails')
        .mockRejectedValue(new InvalidAddressError('Invalid address'));

      const validateChainSpy = vi.spyOn(utils, 'validateChain');

      await expect(
        service.getOriginFeeDetails({
          origin: originChain,
          destination: destChain,
        } as OriginFeeDetailsDto),
      ).rejects.toThrow(BadRequestException);

      expect(getOriginFeeDetailsSpy).toHaveBeenCalled();
      expect(validateChainSpy).toHaveBeenCalledWith(
        originChain,
        SUBSTRATE_CHAINS,
      );
      expect(validateChainSpy).toHaveBeenCalledWith(destChain, CHAINS);
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

    it('should throw BadRequestException for invalid chain', () => {
      const validateChainSpy = vi
        .spyOn(utils, 'validateChain')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getFeeAssets(invalidChain)).toThrow(
        BadRequestException,
      );

      expect(validateChainSpy).toHaveBeenCalledWith(invalidChain, CHAINS);
    });
  });
});
