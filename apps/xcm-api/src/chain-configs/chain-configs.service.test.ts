import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { TChain } from '@paraspell/sdk';
import * as paraspellSdk from '@paraspell/sdk';
import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChainConfigsService } from './chain-configs.service.js';

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    getChainProviders: vi.fn().mockImplementation(() => ['wss://acala.com']),
  };
});

describe('AssetsService', () => {
  let service: ChainConfigsService;
  const chain: TChain = 'Acala';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChainConfigsService],
    }).compile();

    service = module.get<ChainConfigsService>(ChainConfigsService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getChainNames', () => {
    it('should return the list of chain names', () => {
      const result = service.getChainNames();
      expect(result).toEqual(paraspellSdk.CHAINS);
    });
  });

  describe('getParaId', () => {
    const paraId = 2000;
    let getParaIdSpy: MockInstance;

    beforeEach(() => {
      getParaIdSpy = vi.spyOn(paraspellSdk, 'getParaId');
    });

    it('should return parachain ID for a valid chain', () => {
      const result = service.getParaId(chain);

      expect(result).toEqual(paraId);
      expect(getParaIdSpy).toHaveBeenCalledWith(chain);
    });
  });

  describe('getChainByParaId', () => {
    const paraId = 2000;
    let getTChainSpy: MockInstance;

    beforeEach(() => {
      getTChainSpy = vi.spyOn(paraspellSdk, 'getTChain');
    });

    it('should return chain by parachain ID', () => {
      getTChainSpy.mockReturnValue(chain);
      const result = service.getChainByParaId(paraId, 'Polkadot');

      expect(result).toEqual(JSON.stringify(chain));
      expect(getTChainSpy).toHaveBeenCalledWith(paraId, 'Polkadot');
    });

    it('should throw NotFoundException for unknown parachain ID', () => {
      const unknownParaId = 999;

      expect(() => service.getChainByParaId(unknownParaId, 'Polkadot')).toThrow(
        NotFoundException,
      );
      expect(getTChainSpy).toHaveBeenCalledWith(unknownParaId, 'Polkadot');
    });

    it('should throw BadRequestException for invalid ecosystem', () => {
      const invalidEcosystem = 'invalid';

      expect(() => service.getChainByParaId(paraId, invalidEcosystem)).toThrow(
        BadRequestException,
      );
      expect(getTChainSpy).not.toHaveBeenCalled();
    });
  });

  describe('getWsEndpoints', () => {
    it('should return the list of WS endpoints for a given chain', () => {
      const result = service.getWsEndpoints(chain);
      expect(result).toEqual(paraspellSdk.getChainProviders(chain));
    });
  });

  describe('hasDryRunSupport', () => {
    it('should return true if chain has dry run support', () => {
      vi.spyOn(paraspellSdk, 'hasDryRunSupport').mockReturnValue(false);
      const result = service.hasDryRunSupport(chain);
      expect(result).toEqual(false);
    });
  });
});
