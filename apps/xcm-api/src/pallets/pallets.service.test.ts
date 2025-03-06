import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { TNode, TPallet } from '@paraspell/sdk';
import { getDefaultPallet, getSupportedPallets } from '@paraspell/sdk';
import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as utils from '../utils.js';
import { PalletsService } from './pallets.service.js';

const mockPallets: TPallet[] = ['OrmlXTokens', 'RelayerXcm'];
const mockPallet: TPallet = 'PolkadotXcm';

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    getDefaultPallet: vi.fn().mockImplementation(() => mockPallet),
    getSupportedPallets: vi.fn().mockImplementation(() => mockPallets),
  };
});

describe('PalletsService', () => {
  let service: PalletsService;
  let validateNodeSpy: MockInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PalletsService],
    }).compile();

    service = module.get<PalletsService>(PalletsService);
    validateNodeSpy = vi.spyOn(utils, 'validateNode');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDefaultPallet', () => {
    it('should return the default pallet as string', () => {
      const mockNode: TNode = 'Acala';

      const result = service.getDefaultPallet(mockNode);

      expect(validateNodeSpy).toHaveBeenCalledWith(mockNode);
      expect(getDefaultPallet).toHaveBeenCalledWith(mockNode);
      expect(result).toEqual(JSON.stringify(mockPallet));
    });
  });

  describe('getPallets', () => {
    it('should return supported pallets array', () => {
      const mockNode: TNode = 'Acala';

      const result = service.getPallets(mockNode);

      expect(validateNodeSpy).toHaveBeenCalledWith(mockNode);
      expect(getSupportedPallets).toHaveBeenCalledWith(mockNode);
      expect(result).toEqual(mockPallets);
    });
  });
});
