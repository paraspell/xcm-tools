import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { TChain, TPallet } from '@paraspell/sdk';
import {
  getDefaultPallet,
  getNativeAssetsPallet,
  getOtherAssetsPallets,
  getPalletIndex,
  getSupportedPallets,
} from '@paraspell/sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PalletsService } from './pallets.service.js';
import { validatePallet } from './utils/index.js';

const mockPallets: TPallet[] = ['XTokens', 'PolkadotXcm'];
const mockPallet: TPallet = 'PolkadotXcm';
const mockNativeAssetsPallet: TPallet = 'Assets';
const mockOtherAssetsPallets: TPallet[] = ['ForeignAssets', 'Assets'];

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    getDefaultPallet: vi.fn().mockImplementation(() => mockPallet),
    getSupportedPallets: vi.fn().mockImplementation(() => mockPallets),
    getPalletIndex: vi.fn().mockImplementation(() => 0),
    getNativeAssetsPallet: vi
      .fn()
      .mockImplementation(() => mockNativeAssetsPallet),
    getOtherAssetsPallets: vi
      .fn()
      .mockImplementation(() => mockOtherAssetsPallets),
  };
});

vi.mock('./utils/index.js', () => ({
  validatePallet: vi.fn().mockReturnValue('XTokens'),
}));

describe('PalletsService', () => {
  let service: PalletsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PalletsService],
    }).compile();

    service = module.get<PalletsService>(PalletsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDefaultPallet', () => {
    it('should return the default pallet as string', () => {
      const mockChain: TChain = 'Acala';

      const result = service.getDefaultPallet(mockChain);

      expect(getDefaultPallet).toHaveBeenCalledWith(mockChain);
      expect(result).toEqual(JSON.stringify(mockPallet));
    });
  });

  describe('getPallets', () => {
    it('should return supported pallets array', () => {
      const mockChain: TChain = 'Acala';

      const result = service.getPallets(mockChain);

      expect(getSupportedPallets).toHaveBeenCalledWith(mockChain);
      expect(result).toEqual(mockPallets);
    });
  });

  describe('getPalletIndex', () => {
    it('should return the index of the given pallet', () => {
      const mockChain: TChain = 'Acala';
      const mockPallet = 'XTokens';
      const expectedIndex = 0;

      const result = service.getPalletIndex(mockChain, mockPallet);

      expect(validatePallet).toHaveBeenCalledWith(mockPallet);
      expect(getPalletIndex).toHaveBeenCalledWith(mockChain, mockPallet);
      expect(result).toEqual(expectedIndex);
    });
  });

  describe('getNativeAssetsPallet', () => {
    it('should return the native assets pallet as string', () => {
      const mockChain: TChain = 'Acala';

      const result = service.getNativeAssetsPallet(mockChain);

      expect(getNativeAssetsPallet).toHaveBeenCalledWith(mockChain);
      expect(result).toEqual(JSON.stringify(mockNativeAssetsPallet));
    });
  });

  describe('getOtherAssetsPallets', () => {
    it('should return other assets pallets array', () => {
      const mockChain: TChain = 'Acala';

      const result = service.getOtherAssetsPallets(mockChain);

      expect(getOtherAssetsPallets).toHaveBeenCalledWith(mockChain);
      expect(result).toEqual(mockOtherAssetsPallets);
    });
  });
});
