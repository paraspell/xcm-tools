import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PalletsController } from './pallets.controller.js';
import { PalletsService } from './pallets.service.js';
import { TNode, TPallet } from '@paraspell/sdk';
import { mockRequestObject } from '../testUtils.js';
import { AnalyticsService } from '../analytics/analytics.service.js';

// Integration tests to ensure controller and service are working together
describe('PalletsController', () => {
  let controller: PalletsController;
  let palletsService: PalletsService;
  const node: TNode = 'Acala';

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
    it('should return the default pallet for the given node', async () => {
      const defaultPallet: TPallet = 'OrmlXTokens';
      vi.spyOn(palletsService, 'getDefaultPallet' as any).mockResolvedValue(
        defaultPallet,
      );

      const result = await controller.getDefaultPallet(node, mockRequestObject);

      expect(result).toBe(defaultPallet);
      expect(palletsService.getDefaultPallet).toHaveBeenCalledWith(node);
    });
  });

  describe('getPallets', () => {
    it('should return the list of pallets for the given node', async () => {
      const pallets: TPallet[] = ['OrmlXTokens', 'PolkadotXcm'];
      vi.spyOn(palletsService, 'getPallets' as any).mockResolvedValue(pallets);

      const result = await controller.getPallets(node, mockRequestObject);

      expect(result).toBe(pallets);
      expect(palletsService.getPallets).toHaveBeenCalledWith(node);
    });
  });
});
