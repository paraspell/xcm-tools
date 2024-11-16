import type { MockInstance } from 'vitest';
import { vi, describe, beforeEach, it, expect, afterEach } from 'vitest';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AssetsService } from './assets.service.js';
import * as paraspellSdk from '@paraspell/sdk';
import type { TNode } from '@paraspell/sdk';
import * as utils from '../utils.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';

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
  const paraId = 2000;
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

  describe('getNodeNames', () => {
    it('should return the list of node names', () => {
      const result = service.getNodeNames();
      expect(result).toEqual(paraspellSdk.NODE_NAMES);
    });
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
      const assetsObject: paraspellSdk.TNodeAssets = {
        relayChainAssetSymbol: symbol,
        nativeAssetSymbol: 'DOT',
        nativeAssets: [{ symbol, decimals }],
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

  describe('AssetsService', () => {
    let getParaIdSpy: MockInstance;

    beforeEach(() => {
      getParaIdSpy = vi.spyOn(paraspellSdk, 'getParaId');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    describe('getParaId', () => {
      it('should return parachain ID for a valid node', () => {
        const result = service.getParaId(node);

        expect(result).toEqual(paraId);
        expect(getParaIdSpy).toHaveBeenCalledWith(node);
      });

      it('should throw BadRequestException for invalid node', () => {
        const validateNodeSpy = vi
          .spyOn(utils, 'validateNode')
          .mockImplementation(() => {
            throw new BadRequestException();
          });
        expect(() => service.getParaId(invalidNode)).toThrow(
          BadRequestException,
        );

        expect(validateNodeSpy).toHaveBeenCalledWith(invalidNode, {
          excludeEthereum: true,
        });
        expect(getParaIdSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('getNodeByParaId', () => {
    let getTNodeSpy: MockInstance;

    beforeEach(() => {
      getTNodeSpy = vi.spyOn(paraspellSdk, 'getTNode');
    });

    it('should return node by parachain ID', () => {
      getTNodeSpy.mockReturnValue(node);
      const result = service.getNodeByParaId(paraId, 'polkadot');

      expect(result).toEqual(JSON.stringify(node));
      expect(getTNodeSpy).toHaveBeenCalledWith(paraId, 'polkadot');
    });

    it('should throw NotFoundException for unknown parachain ID', () => {
      const unknownParaId = 999;

      expect(() => service.getNodeByParaId(unknownParaId, 'polkadot')).toThrow(
        NotFoundException,
      );
      expect(getTNodeSpy).toHaveBeenCalledWith(unknownParaId, 'polkadot');
    });

    it('should throw BadRequestException for invalid ecosystem', () => {
      const invalidEcosystem = 'invalid';

      expect(() => service.getNodeByParaId(paraId, invalidEcosystem)).toThrow(
        BadRequestException,
      );
      expect(getTNodeSpy).not.toHaveBeenCalled();
    });
  });
});
