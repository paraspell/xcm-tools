import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk';
import { convertSs58 } from '@paraspell/sdk';
import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as utils from '../utils.js';
import { AddressService } from './address.service.js';

const mockOutputAddress = '5Hrj...';

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    convertSs58: vi.fn().mockImplementation(() => mockOutputAddress),
  };
});

describe('AddressService', () => {
  let service: AddressService;
  let validateNodeSpy: MockInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddressService],
    }).compile();

    service = module.get<AddressService>(AddressService);
    validateNodeSpy = vi.spyOn(utils, 'validateNode');
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
      const mockNode: TNodeDotKsmWithRelayChains = 'Acala';

      const result = service.convertSs58(mockAddress, mockNode);

      expect(validateNodeSpy).toHaveBeenCalledWith(mockNode, {
        excludeEthereum: true,
        withRelayChains: true,
      });
      expect(convertSs58).toHaveBeenCalledWith(mockAddress, mockNode);
      expect(result).toEqual(mockOutputAddress);
    });
  });
});
