import type { TPapiApi, TPapiTransaction } from '@paraspell/sdk';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type ExchangeNode from '../dexNodes/DexNode';
import type { TBuildTransactionsOptionsModified, TDestinationInfo, TOriginInfo } from '../types';
import * as createSwapTxModule from './createSwapTx';
import { prepareExtrinsics } from './prepareExtrinsics';
import * as utils from './utils';

vi.mock('./utils', () => ({
  buildToExchangeExtrinsic: vi.fn(),
  buildFromExchangeExtrinsic: vi.fn(),
}));
vi.mock('./createSwapTx', () => ({
  createSwapTx: vi.fn(),
}));

const originApi = {} as TPapiApi;
const dexNode = { node: 'Acala' } as ExchangeNode;

const baseOptions = {
  origin: {
    api: originApi,
    node: 'BifrostPolkadot',
  },
  exchange: {
    baseNode: 'Acala',
  },
  destination: {
    address: 'dest',
    node: 'Crust',
  },
} as unknown as TBuildTransactionsOptionsModified;

describe('prepareExtrinsics', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(createSwapTxModule.createSwapTx).mockResolvedValue({
      tx: 'swapTx' as unknown as TPapiTransaction,
      amountOut: '1000',
    });
  });

  test('returns only swap extrinsic when origin & destination match exchange', async () => {
    const res = await prepareExtrinsics(dexNode, {
      ...baseOptions,
      origin: { ...baseOptions.origin, node: 'Acala' } as TOriginInfo,
      destination: { ...baseOptions.destination, node: 'Acala' } as TDestinationInfo,
    });

    expect(res).toEqual({
      toExchangeTx: undefined,
      swapTx: 'swapTx',
      toDestTx: undefined,
      amountOut: 1000n,
    });

    expect(utils.buildToExchangeExtrinsic).not.toHaveBeenCalled();
    expect(utils.buildFromExchangeExtrinsic).not.toHaveBeenCalled();
    expect(createSwapTxModule.createSwapTx).toHaveBeenCalledWith(dexNode, expect.any(Object));
  });

  test('creates transfer-to-exchange when origin differs', async () => {
    vi.mocked(utils.buildToExchangeExtrinsic).mockResolvedValue(
      'toExchangeTx' as unknown as TPapiTransaction,
    );

    const res = await prepareExtrinsics(dexNode, {
      ...baseOptions,
      destination: { ...baseOptions.destination, node: 'Acala' } as TDestinationInfo,
    });

    expect(res).toEqual({
      toExchangeTx: 'toExchangeTx',
      swapTx: 'swapTx',
      toDestTx: undefined,
      amountOut: 1000n,
    });

    expect(utils.buildToExchangeExtrinsic).toHaveBeenCalledWith(
      expect.objectContaining({ origin: baseOptions.origin }),
    );
  });

  test('creates transfer-from-exchange when destination differs', async () => {
    vi.mocked(utils.buildFromExchangeExtrinsic).mockResolvedValue(
      'toDestTx' as unknown as TPapiTransaction,
    );

    const res = await prepareExtrinsics(dexNode, {
      ...baseOptions,
      origin: { ...baseOptions.origin, node: 'Acala' } as TOriginInfo,
    });

    expect(res).toEqual({
      toExchangeTx: undefined,
      swapTx: 'swapTx',
      toDestTx: 'toDestTx',
      amountOut: 1000n,
    });

    expect(utils.buildFromExchangeExtrinsic).toHaveBeenCalledWith(
      expect.objectContaining({ amount: '1000' }),
    );
  });

  test('creates all three extrinsics when both origin & destination differ', async () => {
    vi.mocked(utils.buildToExchangeExtrinsic).mockResolvedValue(
      'toExchangeTx' as unknown as TPapiTransaction,
    );
    vi.mocked(utils.buildFromExchangeExtrinsic).mockResolvedValue(
      'toDestTx' as unknown as TPapiTransaction,
    );

    const res = await prepareExtrinsics(dexNode, baseOptions);

    expect(res).toEqual({
      toExchangeTx: 'toExchangeTx',
      swapTx: 'swapTx',
      toDestTx: 'toDestTx',
      amountOut: 1000n,
    });
  });
});
