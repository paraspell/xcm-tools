import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { TSubstrateChain } from '@paraspell/sdk';
import { convertSs58, SUBSTRATE_CHAINS } from '@paraspell/sdk';
import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as utils from '../utils.js';
import { AddressService } from './address.service.js';

const mockOutputAddress = '5Hrj...';

vi.mock('@paraspell/sdk', async (importActual) => ({
  ...(await importActual()),
  convertSs58: vi.fn().mockImplementation(() => mockOutputAddress),
}));

describe('AddressService', () => {
  let service: AddressService;
  let validateChainSpy: MockInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddressService],
    }).compile();

    service = module.get<AddressService>(AddressService);
    validateChainSpy = vi.spyOn(utils, 'validateChain');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convertSs58', () => {
    it('should convert ss58 address', () => {
      const mockAddress = '5GrwvaEF...';
      const mockChain: TSubstrateChain = 'Acala';

      const result = service.convertSs58(mockAddress, mockChain);

      expect(validateChainSpy).toHaveBeenCalledWith(
        mockChain,
        SUBSTRATE_CHAINS,
      );
      expect(convertSs58).toHaveBeenCalledWith(mockAddress, mockChain);
      expect(result).toEqual(mockOutputAddress);
    });
  });
});
