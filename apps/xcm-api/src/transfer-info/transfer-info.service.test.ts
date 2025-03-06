import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { TTransferInfo } from '@paraspell/sdk';
import { getTransferInfo, InvalidCurrencyError } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isValidWalletAddress } from '../utils.js';
import { TransferInfoService } from './transfer-info.service.js';

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
        currency: { symbol: 'DOT', amount: '1000' },
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
        currency: { symbol: 'DOT', amount: '1000' },
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
        currency: { symbol: 'DOT', amount: '1000' },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns serialized transfer info successfully for valid inputs', async () => {
    const mockTransferInfo: TTransferInfo = {
      chain: {
        origin: 'Polkadot',
        destination: 'Acala',
        ecosystem: 'polkadot',
      },
      currencyBalanceOrigin: {
        balance: 1000n,
        currency: 'DOT',
      },
      originFeeBalance: {
        balance: 1000n,
        expectedBalanceAfterXCMFee: 1000n,
        xcmFee: {
          sufficientForXCM: true,
          xcmFee: 1000n,
        },
        existentialDeposit: 1000n,
        asset: 'DOT',
        minNativeTransferableAmount: 1000n,
        maxNativeTransferableAmount: 1000n,
      },
      destinationFeeBalance: {
        balance: 1000n,
        currency: 'DOT',
        existentialDeposit: 1000n,
      },
    };
    vi.mocked(getTransferInfo).mockResolvedValue(mockTransferInfo);
    const result = await service.getTransferInfo({
      origin: 'Polkadot',
      destination: 'Kusama',
      accountOrigin: '0x123',
      accountDestination: '0x456',
      currency: { symbol: 'DOT', amount: '1000' },
    });
    expect(result).toEqual(mockTransferInfo);
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
        currency: { symbol: 'DOT', amount: '1000' },
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
        currency: { symbol: 'DOT', amount: '1000' },
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should validate destination wallet address', async () => {
    vi.mocked(isValidWalletAddress).mockImplementation((address) => {
      return address === '0x123';
    });
    await expect(
      service.getTransferInfo({
        origin: 'Polkadot',
        destination: 'Kusama',
        accountOrigin: '0x123',
        accountDestination: '0x456',
        currency: { symbol: 'DOT', amount: '1000' },
      }),
    ).rejects.toThrow('Invalid destination wallet address.');
  });
});
