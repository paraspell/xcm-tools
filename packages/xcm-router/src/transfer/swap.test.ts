/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { vi, describe, it, expect } from 'vitest';
import * as transferUtils from './utils';
import * as utils from '../utils/utils';
import { type ApiPromise } from '@polkadot/api';
import BigNumber from 'bignumber.js';
import { MOCK_TRANSFER_OPTIONS } from '../utils/utils.test';
import { swap } from './swap';
import { type Extrinsic } from '@paraspell/sdk';

describe('swap', () => {
  it('updates status and returns transaction hash on successful swap', async () => {
    const mockSwapApi = {} as ApiPromise;
    const mockTxHash = 'mockTxHash';
    const mockFee = new BigNumber(0);

    const options = { ...MOCK_TRANSFER_OPTIONS, onStatusChange: vi.fn() };

    const submitSpy = vi.spyOn(transferUtils, 'submitSwap').mockResolvedValue(mockTxHash);
    const statusSpy = vi.spyOn(utils, 'maybeUpdateTransferStatus').mockResolvedValue();

    vi.spyOn(utils, 'calculateTransactionFee').mockResolvedValue(mockFee);
    vi.spyOn(transferUtils, 'buildFromExchangeExtrinsic').mockResolvedValue({} as any);
    vi.spyOn(transferUtils, 'buildToExchangeExtrinsic').mockResolvedValue({} as any);

    const txHash = await swap(
      options,
      {
        signAsync: vi.fn().mockResolvedValue('signedTx'),
        send: vi.fn().mockResolvedValue('sentTx'),
      } as unknown as Extrinsic,
      mockSwapApi,
    );

    expect(statusSpy).toHaveBeenCalledWith(expect.any(Function), {
      type: 'SWAP',
      status: 'IN_PROGRESS',
    });
    expect(statusSpy).toHaveBeenCalledWith(expect.any(Function), {
      type: 'SWAP',
      hashes: { SWAP: mockTxHash },
      status: 'SUCCESS',
    });
    expect(submitSpy).toHaveBeenCalledWith(
      mockSwapApi,
      options,
      expect.objectContaining({
        signAsync: expect.any(Function),
        send: expect.any(Function),
      }),
    );
    expect(txHash).toBe(mockTxHash);
  });
});
