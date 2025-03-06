import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { TNode, TPallet } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { mockRequestObject } from '../testUtils.js';
import { PalletsController } from './pallets.controller.js';
import { PalletsService } from './pallets.service.js';

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
      const spy = vi
        .spyOn(palletsService, 'getDefaultPallet')
        .mockResolvedValue(defaultPallet);

      const result = await controller.getDefaultPallet(node, mockRequestObject);

      expect(result).toBe(defaultPallet);
      expect(spy).toHaveBeenCalledWith(node);
    });
  });

  describe('getPallets', () => {
    it('should return the list of pallets for the given node', async () => {
      const pallets: TPallet[] = ['OrmlXTokens', 'PolkadotXcm'];
      const spy = vi
        .spyOn(palletsService, 'getPallets')
        .mockResolvedValue(pallets);

      const result = await controller.getPallets(node, mockRequestObject);

      expect(result).toBe(pallets);
      expect(spy).toHaveBeenCalledWith(node);
    });
  });
});
