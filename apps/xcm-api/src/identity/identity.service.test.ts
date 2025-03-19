import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as sdk from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CreateIdentityDto } from './dto/identity.dto.js';
import { IdentityService } from './identity.service.js';

vi.mock('@paraspell/sdk', () => ({
  createXcmIdentityCall: vi.fn().mockResolvedValue({
    getEncodedData: vi.fn().mockResolvedValue({
      asHex: vi.fn().mockReturnValue('hash'),
    }),
  }),
  createApiInstanceForNode: vi.fn().mockResolvedValue({}),
}));

describe('IdentityService', () => {
  let service: IdentityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdentityService],
    }).compile();

    service = module.get<IdentityService>(IdentityService);
  });

  it('throws BadRequestException if the from node is not valid', async () => {
    const dto = {
      from: 'TestNode',
    } as CreateIdentityDto;

    await expect(service.createIdentityCall(dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('successfully creates identity call when parameters are valid', async () => {
    const dto = {
      from: 'AssetHubPolkadot',
      xcmFee: '1000',
      regIndex: 0,
      maxRegistrarFee: '0',
    } as CreateIdentityDto;

    const result = await service.createIdentityCall(dto);

    expect(result).toEqual('hash');
  });

  it('throws InternalServerErrorException when a generic error is thrown', async () => {
    vi.mocked(sdk.createXcmIdentityCall).mockImplementation(() => {
      throw new Error('Some internal error');
    });

    const dto = {
      from: 'AssetHubPolkadot',
      xcmFee: '1000',
      regIndex: 0,
      maxRegistrarFee: '0',
    } as CreateIdentityDto;

    await expect(service.createIdentityCall(dto)).rejects.toThrow(
      new InternalServerErrorException('Some internal error'),
    );
  });
});
