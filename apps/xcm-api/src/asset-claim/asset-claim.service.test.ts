import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as sdk from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as utils from '../utils.js';
import { AssetClaimService } from './asset-claim.service.js';
import type { AssetClaimDto } from './dto/asset-claim.dto.js';

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    Builder: vi.fn(() => ({
      claimFrom: vi.fn().mockReturnThis(),
      currency: vi.fn().mockReturnThis(),
      address: vi.fn().mockReturnThis(),
      build: vi.fn().mockResolvedValue({
        getEncodedData: vi.fn().mockResolvedValue({
          asHex: vi.fn().mockReturnValue('hash'),
        }),
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

  it('throws BadRequestException if the chain is not valid', async () => {
    const dto = { from: 'InvalidChain', currency: [], address: 'validAddress' };
    sdk.SUBSTRATE_CHAINS.includes = vi.fn().mockReturnValue(false);
    vi.mocked(utils.isValidWalletAddress).mockReturnValue(true);

    await expect(service.claimAssets(dto)).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when fromChain is undefined', async () => {
    const dto = { from: undefined, currency: [], address: 'validAddress' };

    await expect(service.claimAssets(dto)).rejects.toThrow(
      new BadRequestException("You need to provide a 'from' parameter"),
    );
  });

  it('throws BadRequestException if the wallet address is not valid', async () => {
    const dto = { from: 'Acala', currency: [], address: 'invalidAddress' };
    sdk.SUBSTRATE_CHAINS.includes = vi.fn().mockReturnValue(true);
    vi.mocked(utils.isValidWalletAddress).mockReturnValue(false);

    await expect(service.claimAssets(dto)).rejects.toThrow(BadRequestException);
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
    vi.mocked(utils.isValidWalletAddress).mockReturnValue(true);

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
    vi.mocked(utils.isValidWalletAddress).mockReturnValue(true);
    const result = await service.claimAssets(dto);

    expect(result).toEqual('hash');
  });

  it('throws BadRequestException when InvalidCurrencyError is thrown', async () => {
    vi.mocked(sdk.Builder).mockImplementation(() => {
      throw new sdk.InvalidCurrencyError('Invalid currency error');
    });

    const dto = { from: 'Acala', currency: [], address: 'validAddress' };
    sdk.SUBSTRATE_CHAINS.includes = vi.fn().mockReturnValue(true);
    vi.mocked(utils.isValidWalletAddress).mockReturnValue(true);

    await expect(service.claimAssets(dto)).rejects.toThrow(
      new BadRequestException('Invalid currency error'),
    );
  });

  it('throws InternalServerErrorException when a generic error is thrown', async () => {
    vi.mocked(sdk.Builder).mockImplementation(() => {
      throw new Error('Some internal error');
    });

    const dto = { from: 'Acala', currency: [], address: 'validAddress' };
    sdk.SUBSTRATE_CHAINS.includes = vi.fn().mockReturnValue(true);
    vi.mocked(utils.isValidWalletAddress).mockReturnValue(true);

    await expect(service.claimAssets(dto)).rejects.toThrow(
      new InternalServerErrorException('Some internal error'),
    );
  });
});
