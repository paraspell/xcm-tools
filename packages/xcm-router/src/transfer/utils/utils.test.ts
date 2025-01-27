// Unit tests for transfer utils

import { describe, it, expect, beforeAll, vi, afterAll } from 'vitest';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from './utils';
import { type TTransferOptionsModified } from '../../types';
import { transferParams } from '../../RouterBuilder.test';
import {
  type TNodeWithRelayChains,
  createApiInstanceForNode,
  type Extrinsic,
} from '@paraspell/sdk-pjs';
import { type ApiPromise } from '@polkadot/api';
import { FALLBACK_FEE_CALC_ADDRESS } from '../../consts';

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

vi.mock('@paraspell/sdk-pjs', async () => {
  const actual = await vi.importActual('@paraspell/sdk-pjs');
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
});
