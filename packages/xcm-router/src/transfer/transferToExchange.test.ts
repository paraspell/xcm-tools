// Unit tests for transferToExchange function

import { vi, describe, it, expect } from 'vitest';
import * as transferUtils from './utils';
import * as utils from '../utils/utils';
import { type ApiPromise } from '@polkadot/api';
import { MOCK_TRANSFER_OPTIONS } from '../utils/utils.test';
import { transferToExchange } from './transferToExchange';

describe('transferToExchange', () => {
  it('updates status and returns transaction hash on successful transfer to exchange', async () => {
    const mockApi = {} as ApiPromise;
    const mockTxHash = 'mockTxHash';

    const options = { ...MOCK_TRANSFER_OPTIONS, onStatusChange: vi.fn() };

    const submitSpy = vi
      .spyOn(transferUtils, 'submitTransferToExchange')
      .mockResolvedValue(mockTxHash);
    const statusSpy = vi.spyOn(utils, 'maybeUpdateTransferStatus').mockResolvedValue();

    const txHash = await transferToExchange(options, mockApi);

    expect(statusSpy).toHaveBeenCalledWith(expect.any(Function), {
      type: 'TO_EXCHANGE',
      status: 'IN_PROGRESS',
    });
    expect(statusSpy).toHaveBeenCalledWith(expect.any(Function), {
      type: 'TO_EXCHANGE',
      hashes: { TO_EXCHANGE: mockTxHash },
      status: 'SUCCESS',
    });
    expect(submitSpy).toHaveBeenCalledWith(mockApi, options);
    expect(txHash).toBe(mockTxHash);
  });
});
