import { BadRequestException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { TSubstrateChain } from '@paraspell/sdk';
import { convertSs58, InvalidAddressError } from '@paraspell/sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AddressService } from './address.service.js';

const mockOutputAddress = '5Hrj...';

vi.mock('@paraspell/sdk', async (importActual) => ({
  ...(await importActual()),
  convertSs58: vi.fn().mockImplementation(() => mockOutputAddress),
}));

describe('AddressService', () => {
  let service: AddressService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddressService],
    }).compile();

    service = module.get<AddressService>(AddressService);
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

      expect(convertSs58).toHaveBeenCalledWith(mockAddress, mockChain);
      expect(result).toEqual(mockOutputAddress);
    });

    it('should throw BadRequestException for InvalidAddressError', () => {
      const mockAddress = 'INVALID_ADDRESS_FORMAT';
      const mockChain: TSubstrateChain = 'Acala';

      vi.mocked(convertSs58).mockImplementation(() => {
        throw new InvalidAddressError('Invalid address');
      });

      expect(() => service.convertSs58(mockAddress, mockChain)).toThrow(
        BadRequestException,
      );
    });
  });
});
