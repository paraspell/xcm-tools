/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { vi, describe, it, expect } from 'vitest';
import * as transferUtils from './utils';
import * as utils from '../utils/utils';
import { type ApiPromise } from '@polkadot/api';
import BigNumber from 'bignumber.js';
import { MOCK_TRANSFER_OPTIONS } from '../utils/utils.test';
import AcalaExchangeNode from '../dexNodes/Acala/AcalaDex';
import { swap } from './swap';

describe('swap', () => {
  it('updates status and returns transaction hash on successful swap', async () => {
    const mockOriginApi = {} as ApiPromise;
    const mockSwapApi = {} as ApiPromise;
    const mockTxHash = 'mockTxHash';
    const mockAmountOut = 'mockAmountOut';
    const mockFee = new BigNumber(0);

    const options = { ...MOCK_TRANSFER_OPTIONS, onStatusChange: vi.fn() };

    const submitSpy = vi
      .spyOn(transferUtils, 'submitSwap')
      .mockResolvedValue({ txHash: mockTxHash, amountOut: mockAmountOut });
    const statusSpy = vi.spyOn(utils, 'maybeUpdateTransferStatus').mockResolvedValue();

    vi.spyOn(utils, 'calculateTransactionFee').mockResolvedValue(mockFee);
    vi.spyOn(transferUtils, 'buildFromExchangeExtrinsic').mockResolvedValue({} as any);
    vi.spyOn(transferUtils, 'buildToExchangeExtrinsic').mockResolvedValue({} as any);

    const exchangeNode = new AcalaExchangeNode('Acala');

    const { amountOut, txHash } = await swap(options, exchangeNode, mockOriginApi, mockSwapApi);

    expect(statusSpy).toHaveBeenCalledWith(expect.any(Function), {
      type: 'SWAP',
      status: 'IN_PROGRESS',
    });
    expect(statusSpy).toHaveBeenCalledWith(expect.any(Function), {
      type: 'SWAP',
      hashes: { SWAP: mockTxHash },
      status: 'SUCCESS',
    });
    expect(submitSpy).toHaveBeenCalledWith(mockSwapApi, exchangeNode, options, mockFee, mockFee);
    expect(txHash).toBe(mockTxHash);
    expect(amountOut).toBe(mockAmountOut);
  });
});
