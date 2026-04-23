// Unit tests for transfer utils

import type { PolkadotApi, TAssetInfo, TPapiApi, TSubstrateChain } from '@paraspell/sdk';
import { createChainClient } from '@paraspell/sdk';
import { createChainClient as createChainClientPjs } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { transferParams } from '../../builder/RouterBuilder.test';
import type {
  TBuildFromExchangeTxOptions,
  TBuildToExchangeTxOptions,
  TExchangeInfo,
} from '../../types';

const mockApi = { clone: vi.fn().mockReturnValue({}) } as unknown as PolkadotApi<
  unknown,
  unknown,
  unknown
>;
const mockExchangeApi = {} as unknown as PolkadotApi<unknown, unknown, unknown>;
import {
  buildFromExchangeExtrinsic,
  buildToExchangeExtrinsic,
  getFromExchangeFee,
  getToExchangeFee,
} from './utils';

const builderMock = {
  from: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  amount: vi.fn().mockReturnThis(),
  currency: vi.fn().mockReturnThis(),
  sender: vi.fn().mockReturnThis(),
  recipient: vi.fn().mockReturnThis(),
  build: vi.fn().mockReturnValue({
    signAsync: vi.fn().mockResolvedValue('signedTx'),
    send: vi.fn().mockResolvedValue('sentTx'),
  }),
  getXcmFee: vi.fn().mockResolvedValue({ origin: 100n, destination: 200n }),
};

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    createChainClient: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('@paraspell/sdk-core', async () => {
  const actual = await vi.importActual('@paraspell/sdk-core');
  return {
    ...actual,
    Builder: vi.fn().mockImplementation(() => builderMock),
  };
});

vi.mock('@paraspell/sdk-pjs', async () => {
  const actual = await vi.importActual('@paraspell/sdk-pjs');
  return {
    ...actual,
    createChainClient: vi.fn().mockResolvedValue(undefined),
  };
});

describe('transfer utils', () => {
  let parachainPapiApi: TPapiApi;
  let parachainApi: ApiPromise;
  let relaychainApi: TPapiApi;

  const astrAsset: TAssetInfo = {
    symbol: 'ASTR',
    decimals: 12,
    assetId: '0x1234567890abcdef',
    location: { parents: 1, interior: 'Here' },
  };

  const glmrAsset: TAssetInfo = {
    symbol: 'GLMR',
    decimals: 12,
    assetId: '0xabcdef1234567890',
    location: { parents: 1, interior: 'Here' },
  };

  beforeAll(async () => {
    parachainApi = await createChainClientPjs('Acala');
    parachainPapiApi = await createChainClient('Acala');
    relaychainApi = await createChainClient('Polkadot');
  });

  afterAll(() => {
    vi.resetAllMocks();
  });

  describe('buildToExchangeExtrinsic', () => {
    it('builds correct Extrinsic for Polkadot origin', () => {
      const options: TBuildToExchangeTxOptions<unknown, unknown, unknown> = {
        ...transferParams,
        amount: BigInt(transferParams.amount),
        origin: {
          api: relaychainApi,
          chain: 'Polkadot',
          assetFrom: astrAsset,
        },
        exchange: {
          chain: 'Acala',
        } as TExchangeInfo<unknown, unknown, unknown>,
        api: mockApi,
      };

      const extrinsic = buildToExchangeExtrinsic(options);
      expect(extrinsic).toBeDefined();
    });

    it('builds correct Extrinsic for non-Polkadot/Kusama origin', () => {
      const from: TSubstrateChain = 'Astar';
      const options: TBuildToExchangeTxOptions<unknown, unknown, unknown> = {
        ...transferParams,
        amount: BigInt(transferParams.amount),
        origin: {
          api: parachainPapiApi,
          chain: from,
          assetFrom: astrAsset,
        },
        exchange: {
          chain: 'Acala',
        } as TExchangeInfo<unknown, unknown, unknown>,
        api: mockApi,
      };

      const extrinsic = buildToExchangeExtrinsic(options);
      expect(extrinsic).toBeDefined();
    });

    it('handles custom amount and senderAddress correctly', () => {
      const customAmount = 999999999999999n;
      const customSenderAddress = '5D...CustomAddress';
      const options: TBuildToExchangeTxOptions<unknown, unknown, unknown> = {
        ...transferParams,
        sender: customSenderAddress,
        origin: {
          api: parachainPapiApi,
          chain: 'Acala',
          assetFrom: astrAsset,
        },
        exchange: {
          chain: 'Acala',
        } as TExchangeInfo<unknown, unknown, unknown>,
        amount: customAmount,
        api: mockApi,
      };

      const extrinsic = buildToExchangeExtrinsic(options);
      expect(extrinsic).toBeDefined();

      expect(builderMock.currency).toHaveBeenCalledWith({
        location: {
          parents: 1,
          interior: 'Here',
        },
        amount: customAmount,
      });
      expect(builderMock.recipient).toHaveBeenCalledWith(customSenderAddress);
    });

    it('should still build when currencyFrom is missing and from is not Ethereum', () => {
      const options: TBuildToExchangeTxOptions<unknown, unknown, unknown> = {
        ...transferParams,
        amount: BigInt(transferParams.amount),
        origin: {
          api: parachainPapiApi,
          chain: 'Acala',
          assetFrom: astrAsset,
        },
        exchange: {
          chain: 'Acala',
        } as TExchangeInfo<unknown, unknown, unknown>,
        api: mockApi,
      };

      const extrinsic = buildToExchangeExtrinsic(options);
      expect(extrinsic).toBeDefined();
      expect(builderMock.currency).toHaveBeenCalledWith({
        amount: options.amount,
        location: {
          parents: 1,
          interior: 'Here',
        },
      });
    });
  });

  describe('buildFromExchangeExtrinsic', () => {
    it('builds correct Extrinsic for Polkadot destination', () => {
      const options: TBuildFromExchangeTxOptions<unknown, unknown, unknown> = {
        ...transferParams,
        amount: BigInt(transferParams.amount),
        destination: {
          chain: 'Polkadot',
          address: 'MOCK_ADDRESS',
        },
        exchange: {
          apiPjs: parachainApi,
          apiPapi: parachainPapiApi,
          api: mockExchangeApi,
          chain: 'Acala',
          assetFrom: astrAsset,
          assetTo: glmrAsset,
        },
        api: mockApi,
      };
      const extrinsic = buildFromExchangeExtrinsic(options);
      expect(extrinsic).toBeDefined();
    });

    it('builds correct Extrinsic for non-Polkadot/Kusama destination', () => {
      const options: TBuildFromExchangeTxOptions<unknown, unknown, unknown> = {
        ...transferParams,
        amount: BigInt(transferParams.amount),
        destination: {
          chain: 'Astar',
          address: 'MOCK_ADDRESS',
        },
        exchange: {
          apiPapi: parachainPapiApi,
          apiPjs: parachainApi,
          api: mockExchangeApi,
          chain: 'Acala',
          assetFrom: astrAsset,
          assetTo: glmrAsset,
        },
        api: mockApi,
      };
      const extrinsic = buildFromExchangeExtrinsic(options);
      expect(extrinsic).toBeDefined();
    });
  });

  describe('getToExchangeFee', () => {
    it('delegates to builder.getXcmFee with disableFallback', async () => {
      const result = await getToExchangeFee(
        {
          ...transferParams,
          amount: BigInt(transferParams.amount),
          origin: { api: parachainPapiApi, chain: 'Acala', assetFrom: astrAsset },
          exchange: { chain: 'Acala' } as TExchangeInfo<unknown, unknown, unknown>,
          api: mockApi,
        },
        true,
      );

      expect(builderMock.getXcmFee).toHaveBeenCalledWith({ disableFallback: true });
      expect(result).toEqual({ origin: 100n, destination: 200n });
    });
  });

  describe('getFromExchangeFee', () => {
    it('delegates to builder.getXcmFee with disableFallback', async () => {
      const result = await getFromExchangeFee(
        {
          ...transferParams,
          amount: BigInt(transferParams.amount),
          destination: { chain: 'Polkadot', address: 'MOCK_ADDRESS' },
          exchange: {
            apiPjs: parachainApi,
            apiPapi: parachainPapiApi,
            api: mockExchangeApi,
            chain: 'Acala',
            assetFrom: astrAsset,
            assetTo: glmrAsset,
          },
          api: mockApi,
        },
        false,
      );

      expect(builderMock.getXcmFee).toHaveBeenCalledWith({ disableFallback: false });
      expect(result).toEqual({ origin: 100n, destination: 200n });
    });
  });
});
