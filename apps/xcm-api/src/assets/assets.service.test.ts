import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { InvalidAddressError, type TNode } from '@paraspell/sdk';
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
    getTNode: vi.fn().mockImplementation(() => 'Acala'),
  };
});

describe('AssetsService', () => {
  let service: AssetsService;
  const node: TNode = 'Acala';
  const invalidNode = 'InvalidNode';
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

    it('should return assets object for a valid node', () => {
      const assetsObject: paraspellSdk.TChainAssetsInfo = {
        relayChainAssetSymbol: symbol,
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

      const validateNodeSpy = vi.spyOn(utils, 'validateNode');

      getAssetsObjectSpy.mockImplementation(() => assetsObject);

      const result = service.getAssetsObject(node);
      expect(result).toEqual(assetsObject);
      expect(validateNodeSpy).toHaveBeenCalledWith(node);
      expect(getAssetsObjectSpy).toHaveBeenCalledWith(node);
    });

    it('should throw if node is invalid', () => {
      const validateNodeSpy = vi
        .spyOn(utils, 'validateNode')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getAssetsObject(invalidNode)).toThrow(
        BadRequestException,
      );

      expect(validateNodeSpy).toHaveBeenCalledWith(invalidNode);
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

    it('should return asset ID for a valid node and symbol', () => {
      getAssetIdSpy.mockReturnValue(assetId);

      const result = service.getAssetId(node, symbol);

      expect(result).toEqual(assetId);
      expect(getAssetIdSpy).toHaveBeenCalledWith(node, symbol);
    });

    it('should throw NotFoundException for unknown symbol', () => {
      getAssetIdSpy.mockReturnValue(null);

      expect(() => service.getAssetId(node, unknownSymbol)).toThrow(
        NotFoundException,
      );
      expect(getAssetIdSpy).toHaveBeenCalledWith(node, unknownSymbol);
    });

    it('should throw BadRequestException for invalid node', () => {
      const validateNodeSpy = vi
        .spyOn(utils, 'validateNode')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getAssetId(invalidNode, symbol)).toThrow(
        BadRequestException,
      );

      expect(validateNodeSpy).toHaveBeenCalledWith(invalidNode);
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

    it('should return asset location for a valid node and symbol', () => {
      const assetLocation = { currency: { symbol } };
      getAssetLocationSpy.mockReturnValue(assetLocation);

      const result = service.getAssetLocation(node, {
        currency: { symbol },
      });

      expect(result).toEqual(JSON.stringify(assetLocation));
      expect(getAssetLocationSpy).toHaveBeenCalledWith(node, { symbol });
    });

    it('should throw BadRequestException for invalid node', () => {
      const validateNodeSpy = vi
        .spyOn(utils, 'validateNode')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() =>
        service.getAssetLocation(invalidNode, { currency: { symbol } }),
      ).toThrow(BadRequestException);

      expect(validateNodeSpy).toHaveBeenCalledWith(invalidNode, {
        withRelayChains: true,
      });
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

    it('should return relay chain symbol for a valid node', () => {
      const relayChainSymbol = 'KSM';
      getRelayChainSymbolSpy.mockReturnValue(relayChainSymbol);

      const result = service.getRelayChainSymbol(node);

      expect(result).toEqual(JSON.stringify(relayChainSymbol));
      expect(getRelayChainSymbolSpy).toHaveBeenCalledWith(node);
    });

    it('should throw BadRequestException for invalid node', () => {
      const validateNodeSpy = vi
        .spyOn(utils, 'validateNode')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getRelayChainSymbol(invalidNode)).toThrow(
        BadRequestException,
      );

      expect(validateNodeSpy).toHaveBeenCalledWith(invalidNode);
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

    it('should return native assets for a valid node', () => {
      const nativeAssets = [{ symbol: 'KSM', decimals }];
      getNativeAssetsSpy.mockReturnValue(nativeAssets);

      const result = service.getNativeAssets(node);

      expect(result).toEqual(nativeAssets);
      expect(getNativeAssetsSpy).toHaveBeenCalledWith(node);
    });

    it('should throw BadRequestException for invalid node', () => {
      const validateNodeSpy = vi
        .spyOn(utils, 'validateNode')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getNativeAssets(invalidNode)).toThrow(
        BadRequestException,
      );

      expect(validateNodeSpy).toHaveBeenCalledWith(invalidNode);
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

    it('should return other assets for a valid node', () => {
      const otherAssets = [{ assetId, symbol: 'BSK', decimals }];
      getOtherAssetsSpy.mockReturnValue(otherAssets);

      const result = service.getOtherAssets(node);

      expect(result).toEqual(otherAssets);
      expect(getOtherAssetsSpy).toHaveBeenCalledWith(node);
    });

    it('should throw BadRequestException for invalid node', () => {
      const validateNodeSpy = vi
        .spyOn(utils, 'validateNode')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getOtherAssets(invalidNode)).toThrow(
        BadRequestException,
      );

      expect(validateNodeSpy).toHaveBeenCalledWith(invalidNode);
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

    it('should return all assets symbols for a valid node', () => {
      const allAssetSymbols = ['KSM', 'DOT'];
      getAllAssetsSymbolsSpy.mockReturnValue(allAssetSymbols);

      const result = service.getAllAssetsSymbols(node);

      expect(result).toEqual(allAssetSymbols);
      expect(getAllAssetsSymbolsSpy).toHaveBeenCalledWith(node);
    });

    it('should throw BadRequestException for invalid node', () => {
      const validateNodeSpy = vi
        .spyOn(utils, 'validateNode')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getAllAssetsSymbols(invalidNode)).toThrow(
        BadRequestException,
      );

      expect(validateNodeSpy).toHaveBeenCalledWith(invalidNode);
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

    it('should return asset decimals for a valid node and symbol', () => {
      const node = 'Acala';
      const symbol = 'DOT';
      const decimals = 18;
      getAssetDecimalsSpy.mockReturnValue(decimals);

      const result = service.getDecimals(node, symbol);

      expect(result).toEqual(decimals);
      expect(getAssetDecimalsSpy).toHaveBeenCalledWith(node, symbol);
    });

    it('should throw NotFoundException for unknown symbol', () => {
      getAssetDecimalsSpy.mockReturnValue(null);

      expect(() => service.getDecimals(node, unknownSymbol)).toThrow(
        NotFoundException,
      );
      expect(getAssetDecimalsSpy).toHaveBeenCalledWith(node, unknownSymbol);
    });

    it('should throw BadRequestException for invalid node', () => {
      const validateNodeSpy = vi
        .spyOn(utils, 'validateNode')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getDecimals(invalidNode, symbol)).toThrow(
        BadRequestException,
      );

      expect(validateNodeSpy).toHaveBeenCalledWith(invalidNode);
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

    it('should return true if asset is supported for a valid node and symbol', () => {
      hasSupportForAssetSpy.mockReturnValue(true);

      const result = service.hasSupportForAsset(node, symbol);

      expect(result).toEqual(true);
      expect(hasSupportForAssetSpy).toHaveBeenCalledWith(node, symbol);
    });

    it('should return false if asset is not supported for a valid node and symbol', () => {
      hasSupportForAssetSpy.mockReturnValue(false);

      const result = service.hasSupportForAsset(node, unknownSymbol);

      expect(result).toEqual(false);
      expect(hasSupportForAssetSpy).toHaveBeenCalledWith(node, unknownSymbol);
    });

    it('should throw BadRequestException for invalid node', () => {
      const validateNodeSpy = vi
        .spyOn(utils, 'validateNode')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.hasSupportForAsset(invalidNode, symbol)).toThrow(
        BadRequestException,
      );

      expect(validateNodeSpy).toHaveBeenCalledWith(invalidNode);
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

    it('should return supported assets for a valid origin and destination node', () => {
      const supportedAssets = [{ symbol: 'DOT', decimals }];
      getSupportedAssetsSpy.mockReturnValue(supportedAssets);

      const nodeOrigin = 'Acala';
      const nodeDestination = 'Karura';

      const result = service.getSupportedAssets(nodeOrigin, nodeDestination);

      expect(result).toEqual(supportedAssets);
      expect(getSupportedAssetsSpy).toHaveBeenCalledWith(
        nodeOrigin,
        nodeDestination,
      );
    });

    it('should throw BadRequestException for invalid origin node', () => {
      const validateNodeSpy = vi
        .spyOn(utils, 'validateNode')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      const nodeOrigin = 'InvalidNode';
      const nodeDestination = 'Karura';

      expect(() =>
        service.getSupportedAssets(nodeOrigin, nodeDestination),
      ).toThrow(BadRequestException);

      expect(validateNodeSpy).toHaveBeenCalledWith(nodeOrigin, {
        withRelayChains: true,
      });
      expect(getSupportedAssetsSpy).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid destination node', () => {
      const validateNodeSpy = vi
        .spyOn(utils, 'validateNode')
        .mockImplementation((node: string) => {
          if (node === 'Acala') {
            return;
          }
          throw new BadRequestException();
        });

      const nodeOrigin = 'Acala';
      const nodeDestination = 'InvalidNode';

      expect(() =>
        service.getSupportedAssets(nodeOrigin, nodeDestination),
      ).toThrow(BadRequestException);

      expect(validateNodeSpy).toHaveBeenCalledWith(nodeOrigin, {
        withRelayChains: true,
      });
      expect(validateNodeSpy).toHaveBeenCalledWith(nodeDestination, {
        withRelayChains: true,
      });
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

    it('should return supported destinations for a valid node', () => {
      const node = 'Acala';
      const supportedDestinations = ['Karura', 'Moonbeam'];
      getSupportedDestinationsSpy.mockReturnValue(supportedDestinations);
      const result = service.getSupportedDestinations(node, {
        currency: { symbol: 'KSM' },
      });
      expect(result).toEqual(supportedDestinations);
      expect(getSupportedDestinationsSpy).toHaveBeenCalledWith(node, {
        symbol: 'KSM',
      });
    });
  });

  describe('getOriginFeeDetails', () => {
    it('should return origin fee details for a valid origin and destination node', async () => {
      const nodeOrigin = 'Acala';
      const nodeDestination = 'Karura';

      const getOriginFeeDetailsSpy = vi
        .spyOn(paraspellSdk, 'getOriginFeeDetails')
        .mockResolvedValue({ xcmFee: 1n, sufficientForXCM: true });

      const validateNodeSpy = vi.spyOn(utils, 'validateNode');

      const result = await service.getOriginFeeDetails({
        origin: nodeOrigin,
        destination: nodeDestination,
      } as OriginFeeDetailsDto);

      expect(result).toEqual({ xcmFee: 1n, sufficientForXCM: true });
      expect(validateNodeSpy).toHaveBeenCalledWith(nodeOrigin, {
        withRelayChains: true,
        excludeEthereum: true,
      });
      expect(validateNodeSpy).toHaveBeenCalledWith(nodeDestination, {
        withRelayChains: true,
      });
      expect(getOriginFeeDetailsSpy).toHaveBeenCalledWith({
        origin: nodeOrigin,
        destination: nodeDestination,
      });
    });

    it('should throw BadRequestException for invalid origin node', async () => {
      const nodeOrigin = 'InvalidNode';
      const nodeDestination = 'Karura';

      const validateNodeSpy = vi
        .spyOn(utils, 'validateNode')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      await expect(
        service.getOriginFeeDetails({
          origin: nodeOrigin,
          destination: nodeDestination,
        } as OriginFeeDetailsDto),
      ).rejects.toThrow(BadRequestException);

      expect(validateNodeSpy).toHaveBeenCalledWith(nodeOrigin, {
        withRelayChains: true,
        excludeEthereum: true,
      });
    });

    it('should throw BadRequestException for invalid destination node', async () => {
      const nodeOrigin = 'Acala';
      const nodeDestination = 'InvalidNode';

      const validateNodeSpy = vi
        .spyOn(utils, 'validateNode')
        .mockImplementation((node: string) => {
          if (node === 'Acala') {
            return;
          }
          throw new BadRequestException();
        });

      await expect(
        service.getOriginFeeDetails({
          origin: nodeOrigin,
          destination: nodeDestination,
        } as OriginFeeDetailsDto),
      ).rejects.toThrow(BadRequestException);

      expect(validateNodeSpy).toHaveBeenCalledWith(nodeOrigin, {
        withRelayChains: true,
        excludeEthereum: true,
      });
      expect(validateNodeSpy).toHaveBeenCalledWith(nodeDestination, {
        withRelayChains: true,
      });
    });

    it('should throw a BadRequestException if an error occurs inside SDK', async () => {
      const nodeOrigin = 'Acala';
      const nodeDestination = 'Karura';

      const getOriginFeeDetailsSpy = vi
        .spyOn(paraspellSdk, 'getOriginFeeDetails')
        .mockRejectedValue(new InvalidAddressError('Invalid address'));

      const validateNodeSpy = vi.spyOn(utils, 'validateNode');

      await expect(
        service.getOriginFeeDetails({
          origin: nodeOrigin,
          destination: nodeDestination,
        } as OriginFeeDetailsDto),
      ).rejects.toThrow(BadRequestException);

      expect(getOriginFeeDetailsSpy).toHaveBeenCalled();
      expect(validateNodeSpy).toHaveBeenCalledWith(nodeOrigin, {
        withRelayChains: true,
        excludeEthereum: true,
      });
      expect(validateNodeSpy).toHaveBeenCalledWith(nodeDestination, {
        withRelayChains: true,
      });
    });
  });

  describe('getFeeAssets', () => {
    it('should return fee assets for a valid node', () => {
      const node = 'Acala';
      const feeAssets = [
        { symbol: 'KSM', decimals },
      ] as paraspellSdk.TAssetInfo[];
      const getFeeAssetsSpy = vi
        .spyOn(paraspellSdk, 'getFeeAssets')
        .mockReturnValue(feeAssets);

      const result = service.getFeeAssets(node);

      expect(result).toEqual(feeAssets);
      expect(getFeeAssetsSpy).toHaveBeenCalledWith(node);
    });

    it('should throw BadRequestException for invalid node', () => {
      const validateNodeSpy = vi
        .spyOn(utils, 'validateNode')
        .mockImplementation(() => {
          throw new BadRequestException();
        });

      expect(() => service.getFeeAssets(invalidNode)).toThrow(
        BadRequestException,
      );

      expect(validateNodeSpy).toHaveBeenCalledWith(invalidNode, {
        excludeEthereum: true,
        withRelayChains: true,
      });
    });
  });
});
