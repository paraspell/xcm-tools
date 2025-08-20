import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { TAssetsPallet, TChain, TPallet } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { mockRequestObject } from '../testUtils.js';
import { PalletsController } from './pallets.controller.js';
import { PalletsService } from './pallets.service.js';

// Integration tests to ensure controller and service are working together
describe('PalletsController', () => {
  let controller: PalletsController;
  let palletsService: PalletsService;
  const chain: TChain = 'Acala';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PalletsController],
      providers: [
        PalletsService,
        {
          provide: AnalyticsService,
          useValue: { get: () => '', track: vi.fn() },
        },
      ],
    }).compile();

    controller = module.get<PalletsController>(PalletsController);
    palletsService = module.get<PalletsService>(PalletsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDefaultPallet', () => {
    it('should return the default pallet for the given chain', async () => {
      const defaultPallet: TPallet = 'XTokens';
      const spy = vi
        .spyOn(palletsService, 'getDefaultPallet')
        .mockResolvedValue(defaultPallet);

      const result = await controller.getDefaultPallet(
        chain,
        mockRequestObject,
      );

      expect(result).toBe(defaultPallet);
      expect(spy).toHaveBeenCalledWith(chain);
    });
  });

  describe('getPallets', () => {
    it('should return the list of pallets for the given chain', async () => {
      const pallets: TPallet[] = ['XTokens', 'PolkadotXcm'];
      const spy = vi
        .spyOn(palletsService, 'getPallets')
        .mockResolvedValue(pallets);

      const result = await controller.getPallets(chain, mockRequestObject);

      expect(result).toBe(pallets);
      expect(spy).toHaveBeenCalledWith(chain);
    });
  });

  describe('getPalletIndex', () => {
    it('should return the index of the given pallet for the given chain', async () => {
      const pallet = 'XTokens';
      const index = 0;
      const spy = vi
        .spyOn(palletsService, 'getPalletIndex')
        .mockReturnValue(index);

      const result = await controller.getPalletIndex(
        chain,
        { pallet },
        mockRequestObject,
      );

      expect(result).toBe(index.toString());
      expect(spy).toHaveBeenCalledWith(chain, pallet);
    });
  });

  describe('getNativeAssetsPallet', () => {
    it('should return the native-assets pallet for the given chain', async () => {
      const nativePallet = 'Assets' as TPallet;
      const spy = vi
        .spyOn(palletsService, 'getNativeAssetsPallet')
        .mockResolvedValue(nativePallet);

      const result = await controller.getNativeAssetsPallet(
        chain,
        mockRequestObject,
      );

      expect(result).toBe(nativePallet);
      expect(spy).toHaveBeenCalledWith(chain);
    });
  });

  describe('getOtherAssetsPallets', () => {
    it('should return the other-assets pallets for the given chain', async () => {
      const otherPallets: TAssetsPallet[] = ['ForeignAssets', 'Assets'];
      const spy = vi
        .spyOn(palletsService, 'getOtherAssetsPallets')
        .mockResolvedValue(otherPallets);

      const result = await controller.getOtherAssetsPallets(
        chain,
        mockRequestObject,
      );

      expect(result).toBe(otherPallets);
      expect(spy).toHaveBeenCalledWith(chain);
    });
  });
});
