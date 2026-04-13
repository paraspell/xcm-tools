import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as sdk from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssetClaimService } from './asset-claim.service.js';
import type { AssetClaimDto } from './dto/asset-claim.dto.js';

vi.mock('polkadot-api/utils', () => ({
  toHex: vi.fn().mockReturnValue('hash'),
}));

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    Builder: vi.fn(() => ({
      claimFrom: vi.fn().mockReturnThis(),
      currency: vi.fn().mockReturnThis(),
      address: vi.fn().mockReturnThis(),
      build: vi.fn().mockResolvedValue({
        getEncodedData: vi.fn().mockResolvedValue(new Uint8Array()),
      }),
      disconnect: vi.fn(),
    })),
  };
});

vi.mock('../utils', () => ({
  isValidWalletAddress: vi.fn(),
}));

describe('AssetClaimService', () => {
  let service: AssetClaimService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetClaimService],
    }).compile();

    service = module.get<AssetClaimService>(AssetClaimService);
  });

  it('successfully claims assets when parameters are valid', async () => {
    const dto = {
      from: 'Acala',
      currency: [
        {
          id: {
            parents: 2,
            interior: {
              X1: { Parachain: 1000n },
            },
          },
          fun: { Fungible: 100n },
        },
      ],
      address: 'validAddress',
    } as AssetClaimDto;
    sdk.SUBSTRATE_CHAINS.includes = vi.fn().mockReturnValue(true);

    const result = await service.claimAssets(dto);

    expect(result).toEqual('hash');
  });

  it('successfully claims assets when parameters are valid with hash enabled', async () => {
    const dto = {
      from: 'Acala',
      currency: [
        {
          id: {
            parents: 2,
            interior: {
              X1: { Parachain: 1000n },
            },
          },
          fun: { Fungible: 100n },
        },
      ],
      address: 'validAddress',
    } as AssetClaimDto;
    sdk.SUBSTRATE_CHAINS.includes = vi.fn().mockReturnValue(true);
    const result = await service.claimAssets(dto);

    expect(result).toEqual('hash');
  });

  it('throws BadRequestException when InvalidCurrencyError is thrown', async () => {
    vi.mocked(sdk.Builder).mockImplementation(() => {
      throw new sdk.InvalidCurrencyError('Invalid currency error');
    });

    const dto = {
      from: 'Acala' as const,
      currency: [],
      address: 'validAddress',
    };
    sdk.SUBSTRATE_CHAINS.includes = vi.fn().mockReturnValue(true);

    await expect(service.claimAssets(dto)).rejects.toThrow(
      new BadRequestException('Invalid currency error'),
    );
  });

  it('throws InternalServerErrorException when a generic error is thrown', async () => {
    vi.mocked(sdk.Builder).mockImplementation(() => {
      throw new Error('Some internal error');
    });

    const dto = {
      from: 'Acala' as const,
      currency: [],
      address: 'validAddress',
    };
    sdk.SUBSTRATE_CHAINS.includes = vi.fn().mockReturnValue(true);

    await expect(service.claimAssets(dto)).rejects.toThrow(
      new InternalServerErrorException('Some internal error'),
    );
  });
});
