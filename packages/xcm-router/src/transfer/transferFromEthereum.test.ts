/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transferFromEthereum } from './transferFromEthereum';
import { EvmBuilder } from '@paraspell/sdk';
import { TransactionType, TransactionStatus, TTransferOptionsModified } from '../types';
import { maybeUpdateTransferStatus } from '../utils/utils';
import { Signer } from '@polkadot/types/types';
import { Signer as EthersSigner } from 'ethers';

vi.mock('@paraspell/sdk', () => ({
  EvmBuilder: vi.fn().mockImplementation((_provider) =>
    Promise.resolve({
      to: vi.fn().mockReturnThis(),
      address: vi.fn().mockReturnThis(),
      amount: vi.fn().mockReturnThis(),
      currency: vi.fn().mockReturnThis(),
      signer: vi.fn().mockReturnThis(),
      build: vi.fn().mockResolvedValue('transaction-hash'),
    }),
  ),
}));
vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: vi.fn(() => ({})),
  },
}));
vi.mock('../utils/utils', () => ({
  maybeUpdateTransferStatus: vi.fn(),
}));

describe('transferFromEthereum', () => {
  const options: TTransferOptionsModified = {
    onStatusChange: vi.fn(),
    from: 'Ethereum',
    to: 'Acala',
    currencyFrom: 'WETH',
    currencyTo: 'tBTC',
    amount: '1000',
    injectorAddress: '0x1234567890abcdef',
    assetHubAddress: '0xabcdef1234567890',
    recipientAddress: '0xabcdef1234567890',
    feeCalcAddress: '0xabcdef1234567890',
    slippagePct: '0.1',
    signer: {} as Signer,
    ethSigner: {} as EthersSigner,
    exchange: 'Hydration',
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should successfully handle a transfer from Ethereum', async () => {
    vi.mocked(EvmBuilder).mockImplementationOnce(
      () =>
        ({
          to: vi.fn().mockReturnThis(),
          address: vi.fn().mockReturnThis(),
          amount: vi.fn().mockReturnThis(),
          currency: vi.fn().mockReturnThis(),
          signer: vi.fn().mockReturnThis(),
          build: vi.fn().mockResolvedValue('transaction-hash'),
        }) as any,
    );
    await transferFromEthereum(options);

    expect(maybeUpdateTransferStatus).toHaveBeenCalledWith(options.onStatusChange, {
      type: TransactionType.FROM_ETH,
      status: TransactionStatus.IN_PROGRESS,
    });
    expect(EvmBuilder).toHaveBeenCalled();
    expect(maybeUpdateTransferStatus).toHaveBeenCalledWith(options.onStatusChange, {
      type: TransactionType.FROM_ETH,
      status: TransactionStatus.SUCCESS,
    });
  });

  it('should handle errors during the transfer process', async () => {
    const error = new Error('Failed to build transaction');
    vi.mocked(EvmBuilder).mockImplementationOnce(
      () =>
        ({
          to: vi.fn().mockReturnThis(),
          address: vi.fn().mockReturnThis(),
          amount: vi.fn().mockReturnThis(),
          currency: vi.fn().mockReturnThis(),
          signer: vi.fn().mockReturnThis(),
          build: vi.fn().mockRejectedValue(error),
        }) as any,
    );

    await expect(transferFromEthereum(options)).rejects.toThrow('Failed to build transaction');

    expect(maybeUpdateTransferStatus).toHaveBeenCalledWith(options.onStatusChange, {
      type: TransactionType.FROM_ETH,
      status: TransactionStatus.IN_PROGRESS,
    });
    expect(maybeUpdateTransferStatus).not.toHaveBeenCalledWith(options.onStatusChange, {
      type: TransactionType.FROM_ETH,
      status: TransactionStatus.SUCCESS,
    });
  });
});
