import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetClaimService } from './asset-claim.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import * as sdk from '@paraspell/sdk';
import * as utils from '../utils.js';
import { BadRequestException } from '@nestjs/common';
import { ApiPromise } from '@polkadot/api';
import { AssetClaimDto } from './dto/asset-claim.dto.js';

vi.mock('@paraspell/sdk', async () => {
  const actual =
    await vi.importActual<typeof import('@paraspell/sdk')>('@paraspell/sdk');
  return {
    ...actual,
    createApiInstanceForNode: vi.fn(),
    Builder: vi.fn(() => ({
      claimFrom: vi.fn().mockReturnThis(),
      fungible: vi.fn().mockReturnThis(),
      account: vi.fn().mockReturnThis(),
      build: vi.fn().mockResolvedValue('hash'),
      buildSerializedApiCall: vi.fn().mockResolvedValue('success'),
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

  it('throws BadRequestException if the node is not valid', async () => {
    const dto = { from: 'InvalidNode', fungible: [], address: 'validAddress' };
    sdk.NODES_WITH_RELAY_CHAINS.includes = vi.fn().mockReturnValue(false);
    vi.mocked(utils.isValidWalletAddress).mockReturnValue(true);

    await expect(service.claimAssets(dto)).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException if the wallet address is not valid', async () => {
    const dto = { from: 'Acala', fungible: [], address: 'invalidAddress' };
    vi.mocked(utils.isValidWalletAddress).mockReturnValue(false);

    await expect(service.claimAssets(dto)).rejects.toThrow(BadRequestException);
  });

  it('successfully claims assets when parameters are valid', async () => {
    const dto = {
      from: 'Acala',
      fungible: [
        {
          id: {
            parents: 2,
            interior: {
              X1: { Parachain: 1000 },
            },
          },
          fun: { Fungible: '100' },
        },
      ],
      address: 'validAddress',
    } as AssetClaimDto;
    sdk.NODES_WITH_RELAY_CHAINS.includes = vi.fn().mockReturnValue(true);
    vi.mocked(utils.isValidWalletAddress).mockReturnValue(true);
    vi.mocked(sdk.createApiInstanceForNode).mockResolvedValue({
      disconnect: vi.fn(),
    } as unknown as ApiPromise);

    const result = await service.claimAssets(dto);

    expect(result).toEqual('success');
    expect(sdk.createApiInstanceForNode).toHaveBeenCalledWith('Acala');
  });

  it('successfully claims assets when parameters are valid with hash enabled', async () => {
    const dto = {
      from: 'Acala',
      fungible: [
        {
          id: {
            parents: 2,
            interior: {
              X1: { Parachain: 1000 },
            },
          },
          fun: { Fungible: '100' },
        },
      ],
      address: 'validAddress',
    } as AssetClaimDto;
    sdk.NODES_WITH_RELAY_CHAINS.includes = vi.fn().mockReturnValue(true);
    vi.mocked(utils.isValidWalletAddress).mockReturnValue(true);
    vi.mocked(sdk.createApiInstanceForNode).mockResolvedValue({
      disconnect: vi.fn(),
    } as unknown as ApiPromise);

    const result = await service.claimAssets(dto, true);

    expect(result).toEqual('hash');
    expect(sdk.createApiInstanceForNode).toHaveBeenCalledWith('Acala');
  });
});