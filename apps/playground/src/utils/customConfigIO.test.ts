import { Version } from '@paraspell/sdk';
import { describe, expect, it } from 'vitest';

import type { TStoredCustomChains } from '../types/TCustomChain';
import { buildCustomConfig, parseCustomConfig } from './customConfigIO';

const validCustomChain: TStoredCustomChains = {
  ImportChain: {
    input: {
      paraId: 6100,
      ecosystem: 'Polkadot',
      providers: [{ name: 'Seed', endpoint: 'wss://seed.example/ws' }],
      xcmVersion: Version.V5,
    },
    assetsInfo: {
      relaychainSymbol: 'DOT',
      nativeAssetSymbol: 'ImportChain',
      isEVM: false,
      ss58Prefix: 42,
      supportsDryRunApi: false,
      supportsXcmPaymentApi: false,
      assets: [],
    },
  },
};

const validCustomAssets = {
  Astar: [
    {
      symbol: 'IMPASSET',
      decimals: 9,
      location: { parents: 1, interior: { X1: { Parachain: 6101 } } },
      existentialDeposit: '100000000',
    },
  ],
};

describe('customConfigIO', () => {
  describe('buildCustomConfig', () => {
    it('creates a config file structure with version 1', () => {
      const config = buildCustomConfig(validCustomChain, validCustomAssets);
      expect(config).toEqual({
        version: 1,
        customChains: validCustomChain,
        customAssets: validCustomAssets,
      });
    });
  });

  describe('parseCustomConfig - outer shape validation', () => {
    it('throws when text is not valid JSON', () => {
      expect(() => parseCustomConfig('not a json')).toThrow(
        'File is not valid JSON.',
      );
    });

    it('throws when root is not an object', () => {
      expect(() => parseCustomConfig(JSON.stringify(['foo']))).toThrow(
        'Config must be a JSON object.',
      );
      expect(() => parseCustomConfig(JSON.stringify(null))).toThrow(
        'Config must be a JSON object.',
      );
      expect(() => parseCustomConfig(JSON.stringify('string'))).toThrow(
        'Config must be a JSON object.',
      );
    });

    it('throws when customChains is not an object', () => {
      expect(() =>
        parseCustomConfig(JSON.stringify({ customChains: 'invalid' })),
      ).toThrow('"customChains" must be an object.');
      expect(() =>
        parseCustomConfig(JSON.stringify({ customChains: [1, 2, 3] })),
      ).toThrow('"customChains" must be an object.');
    });

    it('throws when customAssets is not an object', () => {
      expect(() =>
        parseCustomConfig(JSON.stringify({ customAssets: 'invalid' })),
      ).toThrow('"customAssets" must be an object.');
      expect(() =>
        parseCustomConfig(JSON.stringify({ customAssets: [1, 2, 3] })),
      ).toThrow('"customAssets" must be an object.');
    });

    it('throws when neither customChains nor customAssets is present', () => {
      expect(() => parseCustomConfig(JSON.stringify({}))).toThrow(
        'Config must contain "customChains" and/or "customAssets".',
      );
    });
  });

  describe('parseCustomConfig - inner customChains validation', () => {
    it('rejects a null custom chain entry', () => {
      expect(() =>
        parseCustomConfig(
          JSON.stringify({ customChains: { EvilChain: null } }),
        ),
      ).toThrow(/Invalid "customChains" at "EvilChain"/);
    });

    it('rejects a primitive custom chain entry', () => {
      expect(() =>
        parseCustomConfig(JSON.stringify({ customChains: { EvilChain: 123 } })),
      ).toThrow(/Invalid "customChains" at "EvilChain"/);
    });

    it('rejects a custom chain missing input or assetsInfo', () => {
      expect(() =>
        parseCustomConfig(JSON.stringify({ customChains: { EvilChain: {} } })),
      ).toThrow(/Invalid "customChains" at "EvilChain\.input"/);
      expect(() =>
        parseCustomConfig(
          JSON.stringify({
            customChains: {
              EvilChain: { input: validCustomChain.ImportChain.input },
            },
          }),
        ),
      ).toThrow(/Invalid "customChains" at "EvilChain\.assetsInfo"/);
    });

    it('rejects a custom chain with malformed input (e.g. invalid ecosystem or empty providers)', () => {
      expect(() =>
        parseCustomConfig(
          JSON.stringify({
            customChains: {
              EvilChain: {
                ...validCustomChain.ImportChain,
                input: {
                  ...validCustomChain.ImportChain.input,
                  ecosystem: 'NonExistentRelay',
                },
              },
            },
          }),
        ),
      ).toThrow(/Invalid "customChains"/);

      expect(() =>
        parseCustomConfig(
          JSON.stringify({
            customChains: {
              EvilChain: {
                ...validCustomChain.ImportChain,
                input: {
                  ...validCustomChain.ImportChain.input,
                  providers: [],
                },
              },
            },
          }),
        ),
      ).toThrow(/Invalid "customChains"/);
    });

    it('rejects a custom chain with malformed assetsInfo', () => {
      expect(() =>
        parseCustomConfig(
          JSON.stringify({
            customChains: {
              EvilChain: {
                ...validCustomChain.ImportChain,
                assetsInfo: {
                  ...validCustomChain.ImportChain.assetsInfo,
                  relaychainSymbol: '',
                },
              },
            },
          }),
        ),
      ).toThrow(/Invalid "customChains"/);
    });
  });

  describe('parseCustomConfig - inner customAssets validation', () => {
    it('rejects string in place of an asset array', () => {
      expect(() =>
        parseCustomConfig(
          JSON.stringify({ customAssets: { AssetHubPolkadot: 'DOTDOTDOT' } }),
        ),
      ).toThrow(/Invalid "customAssets" at "AssetHubPolkadot"/);
    });

    it('rejects mistyped asset entry fields', () => {
      expect(() =>
        parseCustomConfig(
          JSON.stringify({
            customAssets: {
              AssetHubPolkadot: [
                {
                  symbol: 'DOT',
                  decimals: 'ten',
                  location: null,
                  existentialDeposit: 12345,
                },
              ],
            },
          }),
        ),
      ).toThrow(/Invalid "customAssets" at "AssetHubPolkadot\.0\.decimals"/);
    });

    it('rejects invalid location structure in asset entry', () => {
      expect(() =>
        parseCustomConfig(
          JSON.stringify({
            customAssets: {
              AssetHubPolkadot: [
                {
                  symbol: 'DOT',
                  decimals: 10,
                  location: { invalidKey: true },
                },
              ],
            },
          }),
        ),
      ).toThrow(/Invalid "customAssets"/);
    });

    it('rejects empty symbol in asset entry', () => {
      expect(() =>
        parseCustomConfig(
          JSON.stringify({
            customAssets: {
              AssetHubPolkadot: [
                {
                  symbol: '',
                  decimals: 10,
                  location: { parents: 1, interior: 'Here' },
                },
              ],
            },
          }),
        ),
      ).toThrow(/Invalid "customAssets"/);
    });
  });

  describe('parseCustomConfig - valid configurations', () => {
    it('accepts valid custom chains', () => {
      const config = parseCustomConfig(
        JSON.stringify({ customChains: validCustomChain }),
      );
      expect(config.customChains).toEqual(validCustomChain);
      expect(config.customAssets).toEqual({});
      expect(config.version).toBe(1);
    });

    it('accepts valid custom assets without existentialDeposit (e2e shape)', () => {
      const e2eAssetConfig = {
        customAssets: {
          Astar: [
            {
              symbol: 'IMPASSET',
              decimals: 9,
              location: { parents: 1, interior: { X1: { Parachain: 6101 } } },
            },
          ],
        },
      };
      const config = parseCustomConfig(JSON.stringify(e2eAssetConfig));
      expect(config.customAssets.Astar?.[0].symbol).toBe('IMPASSET');
      expect(config.customAssets.Astar?.[0].decimals).toBe(9);
    });

    it('accepts valid full config', () => {
      const fullConfig = {
        version: 1,
        customChains: validCustomChain,
        customAssets: validCustomAssets,
      };
      const parsed = parseCustomConfig(JSON.stringify(fullConfig));
      expect(parsed).toEqual(fullConfig);
    });
  });
});
