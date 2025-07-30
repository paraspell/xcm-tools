import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { CHAINS, type TChain } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { mockRequestObject } from '../testUtils.js';
import { ChainConfigsController } from './chain-configs.controller.js';
import { ChainConfigsService } from './chain-configs.service.js';

describe('AssetsController', () => {
  let controller: ChainConfigsController;
  let service: ChainConfigsService;
  const chain: TChain = 'Acala';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChainConfigsController],
      providers: [
        ChainConfigsService,
        {
          provide: AnalyticsService,
          useValue: { get: () => '', track: vi.fn() },
        },
      ],
    }).compile();

    controller = module.get<ChainConfigsController>(ChainConfigsController);
    service = module.get<ChainConfigsService>(ChainConfigsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getChainNames', () => {
    it('should return the list of chain names', () => {
      const mockResult = CHAINS;
      const spy = vi
        .spyOn(service, 'getChainNames')
        .mockReturnValue(mockResult);

      const result = controller.getChainNames(mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getParaId', () => {
    it('should return parachain id for a valid chain', () => {
      const mockResult = 2009;
      const spy = vi.spyOn(service, 'getParaId').mockReturnValue(mockResult);

      const result = controller.getParaId(chain, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(chain);
    });
  });

  describe('getChainByParaId', () => {
    it('should return assets object for a valid parachain id', () => {
      const paraId = '2009';
      const spy = vi.spyOn(service, 'getChainByParaId').mockReturnValue(paraId);

      const result = controller.getAssetsObject(
        paraId,
        'polkadot',
        mockRequestObject,
      );

      expect(result).toBe(paraId);
      expect(spy).toHaveBeenCalledWith(Number(paraId), 'polkadot');
    });
  });

  describe('getSupportedAssets', () => {
    it('should return supported assets for a valid origin and destination', () => {
      const mockResult = ['wss://acala.com', 'wss://acala2.com'];
      const spy = vi
        .spyOn(service, 'getWsEndpoints')
        .mockReturnValue(mockResult);

      const result = controller.getWsEndpoints(chain, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(chain);
    });
  });

  describe('hasDryRunSupport', () => {
    it('should return true if chain has dry run support', () => {
      const mockResult = true;
      const spy = vi
        .spyOn(service, 'hasDryRunSupport')
        .mockReturnValue(mockResult);

      const result = controller.hasDryRunSupport(chain, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(chain);
    });
  });
});
