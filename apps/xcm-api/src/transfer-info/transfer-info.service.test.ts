/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { getTransferInfo, InvalidCurrencyError } from '@paraspell/sdk';
import { TransferInfoService } from './transfer-info.service.js';
import { isValidWalletAddress } from '../utils.js';

vi.mock('@paraspell/sdk', () => ({
  getTransferInfo: vi.fn(),
  NODES_WITH_RELAY_CHAINS_DOT_KSM: ['Polkadot', 'Kusama'],
  InvalidCurrencyError: class extends Error {},
}));

vi.mock('../utils', () => ({
  isValidWalletAddress: vi.fn(),
}));

describe('TransferInfoService', () => {
  let service: TransferInfoService;

  beforeEach(() => {
    service = new TransferInfoService();
    vi.mocked(isValidWalletAddress).mockReturnValue(true);
  });

  it('throws BadRequestException if the origin node is not valid', async () => {
    await expect(
      service.getTransferInfo({
        origin: 'InvalidNode',
        destination: 'Kusama',
        accountOrigin: '0x123',
        accountDestination: '0x456',
        currency: 'DOT',
        amount: '1000',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException if the destination node is not valid', async () => {
    await expect(
      service.getTransferInfo({
        origin: 'Polkadot',
        destination: 'InvalidNode',
        accountOrigin: '0x123',
        accountDestination: '0x456',
        currency: 'DOT',
        amount: '1000',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException if the origin wallet address is invalid', async () => {
    vi.mocked(isValidWalletAddress).mockReturnValueOnce(false);
    await expect(
      service.getTransferInfo({
        origin: 'Polkadot',
        destination: 'Kusama',
        accountOrigin: '0x123',
        accountDestination: '0x456',
        currency: 'DOT',
        amount: '1000',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns serialized transfer info successfully for valid inputs', async () => {
    vi.mocked(getTransferInfo).mockResolvedValue({ some: 'data' } as any);
    const result = await service.getTransferInfo({
      origin: 'Polkadot',
      destination: 'Kusama',
      accountOrigin: '0x123',
      accountDestination: '0x456',
      currency: 'DOT',
      amount: '1000',
    });
    expect(result).toEqual(JSON.stringify({ some: 'data' }));
  });

  it('handles InvalidCurrencyError by throwing BadRequestException', async () => {
    vi.mocked(getTransferInfo).mockRejectedValue(
      new InvalidCurrencyError('Invalid currency.'),
    );
    await expect(
      service.getTransferInfo({
        origin: 'Polkadot',
        destination: 'Kusama',
        accountOrigin: '0x123',
        accountDestination: '0x456',
        currency: 'DOT',
        amount: '1000',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('handles unknown errors by throwing InternalServerErrorException', async () => {
    vi.mocked(getTransferInfo).mockRejectedValue(new Error('Unknown error.'));
    await expect(
      service.getTransferInfo({
        origin: 'Polkadot',
        destination: 'Kusama',
        accountOrigin: '0x123',
        accountDestination: '0x456',
        currency: 'DOT',
        amount: '1000',
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
