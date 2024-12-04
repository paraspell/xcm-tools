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

    it('builds correct Extrinsic when from is Ethereum and assetFrom.symbol is defined', () => {
      const options: TTransferOptionsModified = {
        ...transferParams,
        from: 'Ethereum',
        assetFrom: { symbol: 'ETH', assetId: '0xeth' },
        exchangeNode: 'Acala',
        exchange: 'AcalaDex',
        feeCalcAddress: FALLBACK_FEE_CALC_ADDRESS,
      };

      const extrinsic = buildToExchangeExtrinsic(relaychainApi, options);
      expect(extrinsic).toBeDefined();

      // Should use 'AssetHubPolkadot' as from
      expect(builderMock.from).toHaveBeenCalledWith('AssetHubPolkadot');
      expect(builderMock.to).toHaveBeenCalledWith('Acala');
      // Should use assetFrom.symbol since it's defined
      expect(builderMock.currency).toHaveBeenCalledWith({
        symbol: 'ETH',
        amount: options.amount,
      });
      expect(builderMock.address).toHaveBeenCalledWith(options.injectorAddress);
      expect(builderMock.build).toHaveBeenCalled();
    });

    it('builds correct Extrinsic when from is Ethereum and assetFrom.symbol is NOT defined', () => {
      const options: TTransferOptionsModified = {
        ...transferParams,
        from: 'Ethereum',
        currencyFrom: { symbol: 'USDT' },
        assetFrom: undefined, // no symbol here
        exchangeNode: 'Acala',
        exchange: 'AcalaDex',
        feeCalcAddress: FALLBACK_FEE_CALC_ADDRESS,
      };

      const extrinsic = buildToExchangeExtrinsic(relaychainApi, options);
      expect(extrinsic).toBeDefined();

      // Should use 'AssetHubPolkadot' as from
      expect(builderMock.from).toHaveBeenCalledWith('AssetHubPolkadot');
      expect(builderMock.to).toHaveBeenCalledWith('Acala');
      // Should fallback to currencyFrom since assetFrom.symbol is not defined
      expect(builderMock.currency).toHaveBeenCalledWith({
        symbol: 'USDT',
        amount: options.amount,
      });
      expect(builderMock.address).toHaveBeenCalledWith(options.injectorAddress);
      expect(builderMock.build).toHaveBeenCalled();
    });

    it('handles custom amount and injectorAddress correctly', () => {
      const customAmount = '999999999999999';
      const customInjectorAddress = '5D...CustomAddress';
      const options: TTransferOptionsModified = {
        ...transferParams,
        from: 'Polkadot',
        currencyFrom: { symbol: 'DOT' },
        exchangeNode: 'Acala',
        exchange: 'AcalaDex',
        feeCalcAddress: FALLBACK_FEE_CALC_ADDRESS,
        amount: customAmount,
        injectorAddress: customInjectorAddress,
      };

      const extrinsic = buildToExchangeExtrinsic(relaychainApi, options);
      expect(extrinsic).toBeDefined();

      expect(builderMock.currency).toHaveBeenCalledWith({
        symbol: 'DOT',
        amount: customAmount,
      });
      expect(builderMock.address).toHaveBeenCalledWith(customInjectorAddress);
    });

    it('should still build when currencyFrom is missing and from is not Ethereum', () => {
      const options: TTransferOptionsModified = {
        ...transferParams,
        from: 'Polkadot',
        exchangeNode: 'Acala',
        exchange: 'AcalaDex',
        feeCalcAddress: FALLBACK_FEE_CALC_ADDRESS,
      };

      const extrinsic = buildToExchangeExtrinsic(relaychainApi, options);
      expect(extrinsic).toBeDefined();
      expect(builderMock.currency).toHaveBeenCalledWith({
        amount: options.amount,
        symbol: 'ASTR',
      });
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
