// Unit tests for transferToExchange function

import { vi, describe, it, expect } from 'vitest';
import * as transferUtils from './utils';
import * as utils from '../utils/utils';
import { type ApiPromise } from '@polkadot/api';
import { transferToDestination } from './transferToDestination';
import { MOCK_TRANSFER_OPTIONS } from '../utils/testUtils';

describe('transferToDestination', () => {
  it('updates status and returns transaction hash on successful transfer to destination', async () => {
    const mockApi = {} as ApiPromise;
    const mockTxHash = 'mockTxHash';
    const mockAmountOut = 'mockAmountOut';

    const options = { ...MOCK_TRANSFER_OPTIONS, onStatusChange: vi.fn() };

    const submitSpy = vi
      .spyOn(transferUtils, 'submitTransferToDestination')
      .mockResolvedValue(mockTxHash);
    const statusSpy = vi.spyOn(utils, 'maybeUpdateTransferStatus').mockResolvedValue();

    const txHash = await transferToDestination(options, mockAmountOut, mockApi);

    expect(statusSpy).toHaveBeenCalledWith(expect.any(Function), {
      type: 'TO_DESTINATION',
      status: 'IN_PROGRESS',
    });
    expect(statusSpy).toHaveBeenCalledWith(expect.any(Function), {
      type: 'TO_DESTINATION',
      hashes: { TO_DESTINATION: mockTxHash },
      status: 'SUCCESS',
    });
    expect(submitSpy).toHaveBeenCalledWith(mockApi, options, mockAmountOut);
    expect(txHash).toBe(mockTxHash);
  });
});
