import { CHAINS, getAssets } from '@paraspell/sdk';
import { describe, expect, it } from 'vitest';

import {
  BuilderOptionsSchema,
  CurrencyCoreWithAmountSchema,
  CustomAssetInfoSchema,
  CustomChainInputSchema,
  EvmApproveDtoSchema,
} from './XTransferDto.js';

describe('location schemas', () => {
  it('accepts every registered asset location', () => {
    const incompatibleLocations = CHAINS.flatMap((chain) =>
      getAssets(chain).flatMap(({ location, symbol }) => {
        const result = CustomAssetInfoSchema.shape.location.safeParse(location);

        return result.success
          ? []
          : [{ chain, symbol, issues: result.error.issues }];
      }),
    );

    expect(incompatibleLocations).toEqual([]);
  });
});

describe('amount schemas', () => {
  it('accepts a decimal amount for a transfer', () => {
    expect(
      CurrencyCoreWithAmountSchema.safeParse({ symbol: 'DOT', amount: '0.5' })
        .success,
    ).toBe(true);
  });

  it.each(['1abc', '1.2.3', 'Infinity', '1e309'])(
    'rejects malformed or non-finite transfer amount %s',
    (amount) => {
      expect(
        CurrencyCoreWithAmountSchema.safeParse({ symbol: 'DOT', amount })
          .success,
      ).toBe(false);
    },
  );

  it('converts an EVM approval amount to base-unit bigint', () => {
    expect(
      EvmApproveDtoSchema.parse({ symbol: 'WETH', amount: '500' }).amount,
    ).toBe(500n);
  });

  it.each(['0.5', '1abc', '1.2.3', 'Infinity', '1e309', '0', '-1'])(
    'rejects invalid EVM approval amount %s',
    (amount) => {
      expect(
        EvmApproveDtoSchema.safeParse({ symbol: 'WETH', amount }).success,
      ).toBe(false);
    },
  );
});

describe('endpoint schemas', () => {
  const customChain = (endpoint: string) => ({
    paraId: 2000,
    ecosystem: 'Polkadot',
    providers: [{ name: 'Custom', endpoint }],
    xcmVersion: 'V5',
  });

  it('accepts wss endpoints in apiOverrides and custom chain providers', () => {
    expect(
      BuilderOptionsSchema.safeParse({
        apiOverrides: {
          Polkadot: 'wss://rpc.polkadot.io',
          Hydration: ['wss://rpc.hydradx.cloud', 'wss://hydration.ibp.network'],
        },
      }).success,
    ).toBe(true);
    expect(
      CustomChainInputSchema.safeParse(customChain('wss://rpc.custom.io'))
        .success,
    ).toBe(true);
  });

  it.each([
    'ws://rpc.polkadot.io',
    'http://127.0.0.1:5432',
    'https://169.254.169.254/latest/meta-data/',
    'rpc.polkadot.io',
    '',
  ])('rejects non-wss endpoint %s', (endpoint) => {
    expect(
      BuilderOptionsSchema.safeParse({ apiOverrides: { Polkadot: endpoint } })
        .success,
    ).toBe(false);
    expect(
      BuilderOptionsSchema.safeParse({
        apiOverrides: { Polkadot: ['wss://rpc.polkadot.io', endpoint] },
      }).success,
    ).toBe(false);
    expect(
      CustomChainInputSchema.safeParse(customChain(endpoint)).success,
    ).toBe(false);
  });
});
