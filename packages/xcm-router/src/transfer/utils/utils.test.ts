// Unit tests for transfer utils

import type { TPapiApi, TPapiTransaction } from '@paraspell/sdk';
import { createApiInstanceForNode, type TNodeWithRelayChains } from '@paraspell/sdk';
import { createApiInstanceForNode as createApiInstanceForNodePjs } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { transferParams } from '../../builder/RouterBuilder.test';
import type {
  TBuildFromExchangeTxOptions,
  TBuildToExchangeTxOptions,
  TExchangeInfo,
} from '../../types';
import { buildFromExchangeExtrinsic, buildToExchangeExtrinsic } from './utils';

const builderMock = {
  from: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  amount: vi.fn().mockReturnThis(),
  currency: vi.fn().mockReturnThis(),
  address: vi.fn().mockReturnThis(),
  senderAddress: vi.fn().mockReturnThis(),
  build: vi.fn().mockReturnValue({
    signAsync: vi.fn().mockResolvedValue('signedTx'),
    send: vi.fn().mockResolvedValue('sentTx'),
  } as unknown as TPapiTransaction),
};

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    createApiInstanceForNode: vi.fn().mockResolvedValue(undefined),
    Builder: vi.fn().mockImplementation(() => builderMock),
  };
});

vi.mock('@paraspell/sdk-pjs', async () => {
  const actual = await vi.importActual('@paraspell/sdk-pjs');
  return {
    ...actual,
    createApiInstanceForNode: vi.fn().mockResolvedValue(undefined),
  };
});

describe('transfer utils', () => {
  let parachainPapiApi: TPapiApi;
  let parachainApi: ApiPromise;
  let relaychainApi: TPapiApi;

  beforeAll(async () => {
    parachainApi = await createApiInstanceForNodePjs('Acala');
    parachainPapiApi = await createApiInstanceForNode('Acala');
    relaychainApi = await createApiInstanceForNode('Polkadot');
  });

  afterAll(() => {
    vi.resetAllMocks();
  });

  describe('buildToExchangeExtrinsic', () => {
    it('builds correct Extrinsic for Polkadot origin', () => {
      const options: TBuildToExchangeTxOptions = {
        ...transferParams,
        origin: {
          api: relaychainApi,
          node: 'Polkadot',
          assetFrom: { symbol: 'ASTR', assetId: '0x1234567890abcdef' },
        },
        exchange: {
          baseNode: 'Acala',
        } as TExchangeInfo,
      };

      const extrinsic = buildToExchangeExtrinsic(options);
      expect(extrinsic).toBeDefined();
    });

    it('builds correct Extrinsic for non-Polkadot/Kusama origin', () => {
      const from: TNodeWithRelayChains = 'Astar';
      const options: TBuildToExchangeTxOptions = {
        ...transferParams,
        origin: {
          api: parachainPapiApi,
          node: from,
          assetFrom: { symbol: 'ASTR', assetId: '0x1234567890abcdef' },
        },
        exchange: {
          baseNode: 'Acala',
        } as TExchangeInfo,
      };

      const extrinsic = buildToExchangeExtrinsic(options);
      expect(extrinsic).toBeDefined();
    });

    it('handles custom amount and senderAddress correctly', () => {
      const customAmount = '999999999999999';
      const customSenderAddress = '5D...CustomAddress';
      const options: TBuildToExchangeTxOptions = {
        ...transferParams,
        senderAddress: customSenderAddress,
        origin: {
          api: parachainPapiApi,
          node: 'Acala',
          assetFrom: { symbol: 'ASTR', assetId: '0x1234567890abcdef' },
        },
        exchange: {
          baseNode: 'Acala',
        } as TExchangeInfo,
        amount: customAmount,
      };

      const extrinsic = buildToExchangeExtrinsic(options);
      expect(extrinsic).toBeDefined();

      expect(builderMock.currency).toHaveBeenCalledWith({
        id: '0x1234567890abcdef',
        amount: customAmount,
      });
      expect(builderMock.address).toHaveBeenCalledWith(customSenderAddress);
    });

    it('should still build when currencyFrom is missing and from is not Ethereum', () => {
      const options: TBuildToExchangeTxOptions = {
        ...transferParams,
        origin: {
          api: parachainPapiApi,
          node: 'Acala',
          assetFrom: { symbol: 'ASTR', assetId: '0x1234567890abcdef' },
        },
        exchange: {
          baseNode: 'Acala',
        } as TExchangeInfo,
      };

      const extrinsic = buildToExchangeExtrinsic(options);
      expect(extrinsic).toBeDefined();
      expect(builderMock.currency).toHaveBeenCalledWith({
        amount: options.amount,
        id: '0x1234567890abcdef',
      });
    });
  });

  describe('buildFromExchangeExtrinsic', () => {
    it('builds correct Extrinsic for Polkadot destination', () => {
      const options: TBuildFromExchangeTxOptions = {
        ...transferParams,
        destination: {
          node: 'Polkadot',
          address: 'MOCK_ADDRESS',
        },
        exchange: {
          api: parachainApi,
          apiPapi: parachainPapiApi,
          baseNode: 'Acala',
          exchangeNode: 'AcalaDex',
          assetFrom: { symbol: 'ASTR', assetId: '0x1234567890abcdef' },
          assetTo: { symbol: 'GLMR', assetId: '0xabcdef1234567890' },
        },
      };
      const extrinsic = buildFromExchangeExtrinsic(options);
      expect(extrinsic).toBeDefined();
    });

    it('builds correct Extrinsic for non-Polkadot/Kusama destination', () => {
      const options: TBuildFromExchangeTxOptions = {
        ...transferParams,
        destination: {
          node: 'Astar',
          address: 'MOCK_ADDRESS',
        },
        exchange: {
          apiPapi: parachainPapiApi,
          api: parachainApi,
          baseNode: 'Acala',
          exchangeNode: 'AcalaDex',
          assetFrom: { symbol: 'ASTR', assetId: '0x1234567890abcdef' },
          assetTo: { symbol: 'GLMR', assetId: '0xabcdef1234567890' },
        },
      };
      const extrinsic = buildFromExchangeExtrinsic(options);
      expect(extrinsic).toBeDefined();
    });
  });
});
