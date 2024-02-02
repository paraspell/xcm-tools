// Unit tests for buildTransferExtrinsics function

import { describe, it, expect, vi, afterAll } from 'vitest';
import * as utils from '../utils/utils';
import * as transferUtils from './utils';
import * as dexNodeFactory from '../dexNodes/DexNodeFactory';
import * as selectBestExchange from './selectBestExchange';
import { buildTransferExtrinsics } from './buildTransferExtrinsics';
import { MOCK_TRANSFER_OPTIONS } from '../utils/utils.test';
import { type TTransferOptions } from '../types';
import type ExchangeNode from '../dexNodes/DexNode';
import { createApiInstanceForNode } from '@paraspell/sdk';

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    createApiInstanceForNode: vi.fn().mockResolvedValue(undefined),
  };
});

describe('buildTransferExtrinsics', () => {
  afterAll(() => {
    vi.resetAllMocks();
  });

  it('should build transfer extrinsics correctly - manual exchange selection', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'AcalaDex',
    };

    const fromExchangeTxSpy = vi
      .spyOn(transferUtils, 'buildFromExchangeExtrinsic')
      .mockReturnValue({} as any);
    const toExchangeTxSpy = vi
      .spyOn(transferUtils, 'buildToExchangeExtrinsic')
      .mockReturnValue({} as any);
    const feeSpy = vi.spyOn(utils, 'calculateTransactionFee').mockReturnValue({} as any);
    const validateSpy = vi.spyOn(utils, 'validateRelayChainCurrency').mockReturnValue({} as any);
    vi.spyOn(dexNodeFactory, 'default').mockReturnValue({
      node: 'Acala',
      createApiInstance: vi.fn().mockResolvedValue({}),
      swapCurrency: vi.fn().mockResolvedValue({}),
    } as unknown as ExchangeNode);

    const result = await buildTransferExtrinsics(options);

    expect(result).toBeDefined();
    expect(result.txs).toHaveLength(3);
    expect(createApiInstanceForNode).toHaveBeenCalled();
    expect(validateSpy).toHaveBeenCalledTimes(2);
    expect(feeSpy).toHaveBeenCalledTimes(2);
    expect(fromExchangeTxSpy).toHaveBeenCalledTimes(2);
    expect(toExchangeTxSpy).toHaveBeenCalled();
  });

  it('should build transfer extrinsics correctly - auto exchange selection', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: undefined,
    };

    const fromExchangeTxSpy = vi
      .spyOn(transferUtils, 'buildFromExchangeExtrinsic')
      .mockReturnValue({} as any);
    const toExchangeTxSpy = vi
      .spyOn(transferUtils, 'buildToExchangeExtrinsic')
      .mockReturnValue({} as any);
    const feeSpy = vi.spyOn(utils, 'calculateTransactionFee').mockReturnValue({} as any);
    const validateSpy = vi.spyOn(utils, 'validateRelayChainCurrency').mockReturnValue({} as any);
    const selectBestExchangeSpy = vi
      .spyOn(selectBestExchange, 'selectBestExchange')
      .mockReturnValue(
        Promise.resolve({
          node: 'Acala',
          createApiInstance: vi.fn().mockResolvedValue({}),
          swapCurrency: vi.fn().mockResolvedValue({}),
        } as unknown as ExchangeNode),
      );

    const result = await buildTransferExtrinsics(options);

    expect(result).toBeDefined();
    expect(result.txs).toHaveLength(3);
    expect(createApiInstanceForNode).toHaveBeenCalled();
    expect(validateSpy).toHaveBeenCalledTimes(2);
    expect(selectBestExchangeSpy).toHaveBeenCalledTimes(1);
    expect(feeSpy).toHaveBeenCalledTimes(2);
    expect(fromExchangeTxSpy).toHaveBeenCalledTimes(2);
    expect(toExchangeTxSpy).toHaveBeenCalled();
  });
});
