// Unit tests for transfer utils

import { describe, it, expect, beforeAll, vi, afterAll } from 'vitest';
import {
  buildFromExchangeExtrinsic,
  buildToExchangeExtrinsic,
  submitSwap,
  submitTransferToDestination,
  submitTransferToExchange,
} from './utils';
import { type TTransferOptionsModified } from '../types';
import { transferParams } from '../RouterBuilder.test';
import {
  type TNodeWithRelayChains,
  createApiInstanceForNode,
  type Extrinsic,
} from '@paraspell/sdk';
import { type ApiPromise } from '@polkadot/api';
import * as transactionUtils from '../utils/submitTransaction';
import { FALLBACK_FEE_CALC_ADDRESS } from '../consts/consts';

const builderMock = {
  from: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  amount: vi.fn().mockReturnThis(),
  currency: vi.fn().mockReturnThis(),
  address: vi.fn().mockReturnThis(),
  build: vi.fn().mockReturnValue({
    signAsync: vi.fn().mockResolvedValue('signedTx'),
    send: vi.fn().mockResolvedValue('sentTx'),
  } as unknown as Extrinsic),
};

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    createApiInstanceForNode: vi.fn().mockResolvedValue(undefined),
    Builder: vi.fn().mockImplementation(() => builderMock),
  };
});

describe('transfer utils', () => {
  let parachainApi: ApiPromise;
  let relaychainApi: ApiPromise;

  beforeAll(async () => {
    parachainApi = await createApiInstanceForNode('Acala');
    relaychainApi = await createApiInstanceForNode('Polkadot');
  });

  afterAll(() => {
    vi.resetAllMocks();
  });

  describe('buildToExchangeExtrinsic', () => {
    it('builds correct Extrinsic for Polkadot origin', () => {
      const from: TNodeWithRelayChains = 'Polkadot';
      const options: TTransferOptionsModified = {
        ...transferParams,
        assetFrom: { symbol: 'ASTR', assetId: '0x1234567890abcdef' },
        assetTo: { symbol: 'GLMR', assetId: '0xabcdef1234567890' },
        from,
        exchange: 'AcalaDex',
        exchangeNode: 'Acala',
        feeCalcAddress: FALLBACK_FEE_CALC_ADDRESS,
      };

      const extrinsic = buildToExchangeExtrinsic(relaychainApi, options);
      expect(extrinsic).toBeDefined();
    });

    it('builds correct Extrinsic for non-Polkadot/Kusama origin', () => {
      const from: TNodeWithRelayChains = 'Astar';
      const options: TTransferOptionsModified = {
        ...transferParams,
        from,
        assetFrom: { symbol: 'ASTR', assetId: '0x1234567890abcdef' },
        assetTo: { symbol: 'GLMR', assetId: '0xabcdef1234567890' },
        exchangeNode: 'Acala',
        exchange: 'AcalaDex',
        feeCalcAddress: FALLBACK_FEE_CALC_ADDRESS,
      };

      const extrinsic = buildToExchangeExtrinsic(parachainApi, options);
      expect(extrinsic).toBeDefined();
    });
  });

  describe('buildFromExchangeExtrinsic', () => {
    it('builds correct Extrinsic for Polkadot destination', () => {
      const to: TNodeWithRelayChains = 'Polkadot';
      const options: TTransferOptionsModified = {
        ...transferParams,
        to,
        exchangeNode: 'Acala',
        exchange: 'AcalaDex',
        assetFrom: { symbol: 'ASTR', assetId: '0x1234567890abcdef' },
        assetTo: { symbol: 'GLMR', assetId: '0xabcdef1234567890' },
        feeCalcAddress: FALLBACK_FEE_CALC_ADDRESS,
      };
      const extrinsic = buildFromExchangeExtrinsic(parachainApi, options, '10000000000');
      expect(extrinsic).toBeDefined();
    });

    it('builds correct Extrinsic for non-Polkadot/Kusama destination', () => {
      const to: TNodeWithRelayChains = 'Astar';
      const options: TTransferOptionsModified = {
        ...transferParams,
        to,
        exchangeNode: 'Acala',
        exchange: 'AcalaDex',
        assetFrom: { symbol: 'ASTR', assetId: '0x1234567890abcdef' },
        assetTo: { symbol: 'GLMR', assetId: '0xabcdef1234567890' },
        feeCalcAddress: FALLBACK_FEE_CALC_ADDRESS,
      };
      const extrinsic = buildFromExchangeExtrinsic(parachainApi, options, '10000000000');
      expect(extrinsic).toBeDefined();
    });
  });

  describe('submitSwap', () => {
    it('submits a swap and returns amountOut and txHash', async () => {
      const spy = vi.spyOn(transactionUtils, 'submitTransaction').mockResolvedValue('mockedTxHash');
      const options: TTransferOptionsModified = {
        ...transferParams,
        exchangeNode: 'Acala',
        exchange: 'AcalaDex',
        assetFrom: { symbol: 'ASTR', assetId: '0x1234567890abcdef' },
        assetTo: { symbol: 'GLMR', assetId: '0xabcdef1234567890' },
        feeCalcAddress: FALLBACK_FEE_CALC_ADDRESS,
      };

      const txHash = await submitSwap(parachainApi, options, {
        signAsync: vi.fn().mockResolvedValue('signedTx'),
        send: vi.fn().mockResolvedValue('sentTx'),
      } as unknown as Extrinsic);

      expect(txHash).toBeDefined();
      expect(txHash).toBe('mockedTxHash');
      expect(spy).toHaveBeenCalledWith(
        parachainApi,
        expect.objectContaining({
          signAsync: expect.any(Function),
          send: expect.any(Function),
        }),
        options.signer,
        options.injectorAddress,
      );
    });
  });

  describe('submitTransferToExchange', () => {
    it('submits a transfer and returns a transaction hash', async () => {
      const spy = vi.spyOn(transactionUtils, 'submitTransaction').mockResolvedValue('mockedTxHash');
      const options: TTransferOptionsModified = {
        ...transferParams,
        exchangeNode: 'Acala',
        exchange: 'AcalaDex',
        assetFrom: { symbol: 'ASTR', assetId: '0x1234567890abcdef' },
        assetTo: { symbol: 'GLMR', assetId: '0xabcdef1234567890' },
        feeCalcAddress: FALLBACK_FEE_CALC_ADDRESS,
      };
      const result = await submitTransferToExchange(relaychainApi, options);

      expect(result).toBe('mockedTxHash');
      expect(spy).toHaveBeenCalledWith(
        relaychainApi,
        expect.objectContaining({
          signAsync: expect.any(Function),
          send: expect.any(Function),
        }),
        options.signer,
        options.injectorAddress,
      );
    });
  });

  describe('submitTransferToDestination', () => {
    it('submits a transfer and returns a transaction hash', async () => {
      const spy = vi.spyOn(transactionUtils, 'submitTransaction').mockResolvedValue('mockedTxHash');
      const options: TTransferOptionsModified = {
        ...transferParams,
        exchangeNode: 'Acala',
        exchange: 'AcalaDex',
        assetFrom: { symbol: 'ASTR', assetId: '0x1234567890abcdef' },
        assetTo: { symbol: 'GLMR', assetId: '0xabcdef1234567890' },
        feeCalcAddress: FALLBACK_FEE_CALC_ADDRESS,
      };

      const result = await submitTransferToDestination(parachainApi, options, '10000000000');

      expect(result).toBe('mockedTxHash');
      expect(spy).toHaveBeenCalledWith(
        parachainApi,
        expect.objectContaining({
          signAsync: expect.any(Function),
          send: expect.any(Function),
        }),
        options.signer,
        options.injectorAddress,
      );
    });
  });
});
