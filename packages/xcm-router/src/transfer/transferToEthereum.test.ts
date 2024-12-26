import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transferToEthereum } from './transferToEthereum';
import { createApiInstanceForNode } from '@paraspell/sdk-pjs';
import type { TTransferOptionsModified } from '../types';
import { TransactionType, TransactionStatus } from '../types';
import { maybeUpdateTransferStatus } from '../utils/utils';
import { submitTransferToDestination } from './utils';
import type { Signer } from '@polkadot/types/types';
import type { Signer as EthersSigner } from 'ethers';
import type { ApiPromise } from '@polkadot/api';

vi.mock('@paraspell/sdk-pjs', () => ({
  createApiInstanceForNode: vi.fn(),
}));
vi.mock('../utils/utils', () => ({
  maybeUpdateTransferStatus: vi.fn(),
}));
vi.mock('./utils', () => ({
  submitTransferToDestination: vi.fn(),
}));

describe('transferToEthereum', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const options: TTransferOptionsModified = {
    onStatusChange: vi.fn(),
    from: 'Acala',
    to: 'Ethereum',
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

  it('should initiate a transfer to Ethereum and handle success', async () => {
    const amountOut = '1000';
    const mockApi = {} as ApiPromise;
    const txHash = '0x1234567890abcdef';

    vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApi);
    vi.mocked(submitTransferToDestination).mockResolvedValue(txHash);

    await transferToEthereum(options, amountOut);

    expect(createApiInstanceForNode).toHaveBeenCalledWith('AssetHubPolkadot');
    expect(maybeUpdateTransferStatus).toHaveBeenCalledWith(options.onStatusChange, {
      type: TransactionType.TO_ETH,
      status: TransactionStatus.IN_PROGRESS,
    });
    expect(submitTransferToDestination).toHaveBeenCalledWith(mockApi, options, amountOut, true);
    expect(maybeUpdateTransferStatus).toHaveBeenCalledWith(options.onStatusChange, {
      type: TransactionType.TO_ETH,
      status: TransactionStatus.SUCCESS,
    });
  });

  it('should not proceed with transfer if API instance creation fails', async () => {
    const amountOut = '1000';
    const error = new Error('Failed to create API instance');

    vi.mocked(createApiInstanceForNode).mockRejectedValue(error);

    await expect(transferToEthereum(options, amountOut)).rejects.toThrow(
      'Failed to create API instance',
    );

    expect(createApiInstanceForNode).toHaveBeenCalledWith('AssetHubPolkadot');
    expect(maybeUpdateTransferStatus).toHaveBeenCalledWith(options.onStatusChange, {
      type: TransactionType.TO_ETH,
      status: TransactionStatus.IN_PROGRESS,
    });

    // Verify that the transfer does not proceed if API instance creation fails
    expect(submitTransferToDestination).not.toHaveBeenCalled();
  });
});
