import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transferFromEthereum } from './transferFromEthereum';
import { EvmBuilder } from '@paraspell/sdk-pjs';
import type { TTransferOptionsModified } from '../types';
import { TransactionType, TransactionStatus } from '../types';
import { maybeUpdateTransferStatus } from '../utils/utils';
import type { Signer } from '@polkadot/types/types';
import type { Signer as EthersSigner } from 'ethers';

vi.mock('@paraspell/sdk-pjs', () => ({
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
    currencyFrom: { symbol: 'WETH' },
    currencyTo: { symbol: 'tBTC' },
    assetFrom: {
      symbol: 'WETH',
      assetId: '0x1234567890abcdef',
    },
    assetTo: {
      symbol: 'tBTC',
      assetId: '0xabcdef1234567890',
    },
    amount: '1000',
    injectorAddress: '0x1234567890abcdef',
    assetHubAddress: '0xabcdef1234567890',
    recipientAddress: '0xabcdef1234567890',
    feeCalcAddress: '0xabcdef1234567890',
    slippagePct: '0.1',
    signer: {} as Signer,
    ethSigner: {} as EthersSigner,
    exchangeNode: 'Hydration',
    exchange: 'HydrationDex',
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should successfully handle a transfer from Ethereum', async () => {
    vi.mocked(EvmBuilder).mockImplementationOnce((() => ({
      from: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
      address: vi.fn().mockReturnThis(),
      amount: vi.fn().mockReturnThis(),
      currency: vi.fn().mockReturnThis(),
      signer: vi.fn().mockReturnThis(),
      build: vi.fn().mockResolvedValue('transaction-hash'),
    })) as unknown as typeof EvmBuilder);
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
    vi.mocked(EvmBuilder).mockImplementationOnce((() => ({
      from: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
      address: vi.fn().mockReturnThis(),
      amount: vi.fn().mockReturnThis(),
      currency: vi.fn().mockReturnThis(),
      signer: vi.fn().mockReturnThis(),
      build: vi.fn().mockRejectedValue(error),
    })) as unknown as typeof EvmBuilder);

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
