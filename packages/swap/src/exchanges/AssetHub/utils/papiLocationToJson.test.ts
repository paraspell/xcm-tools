import { describe, expect, it } from 'vitest';

import { papiLocationToJson } from './papiLocationToJson';

const fakeBinary = (hex: string) => ({ asHex: () => hex });

describe('papiLocationToJson', () => {
  it('flattens enum { type, value } into { VariantName: value }', () => {
    expect(
      papiLocationToJson({
        parents: 1,
        interior: { type: 'X1', value: [{ type: 'Parachain', value: 2000 }] },
      }),
    ).toEqual({
      parents: 1,
      interior: { X1: [{ Parachain: 2000 }] },
    });
  });

  it('normalizes v3-style X1 (single junction, not array) to array form', () => {
    expect(
      papiLocationToJson({
        parents: 1,
        interior: { type: 'X1', value: { type: 'Parachain', value: 2039 } },
      }),
    ).toEqual({
      parents: 1,
      interior: { X1: [{ Parachain: 2039 }] },
    });
  });

  it('renders Here (value: undefined) as null', () => {
    expect(papiLocationToJson({ type: 'Here', value: undefined })).toEqual({ Here: null });
  });

  it('lowercases plain NetworkId variants but keeps non-network variants', () => {
    expect(papiLocationToJson({ type: 'Kusama', value: undefined })).toEqual({ kusama: null });
    expect(papiLocationToJson({ type: 'Polkadot', value: undefined })).toEqual({ polkadot: null });
    // Here / X1 / etc. stay PascalCase
    expect(papiLocationToJson({ type: 'Here', value: undefined })).toEqual({ Here: null });
  });

  it('keeps struct-variant NetworkIds in PascalCase', () => {
    expect(
      papiLocationToJson({
        type: 'Ethereum',
        value: { chain_id: 1n },
      }),
    ).toEqual({ Ethereum: { chainId: 1n } });
  });

  it('converts snake_case struct fields to camelCase', () => {
    expect(
      papiLocationToJson({
        type: 'AccountKey20',
        value: { network: null, account_key: fakeBinary('0xdeadbeef') },
      }),
    ).toEqual({ AccountKey20: { network: null, accountKey: '0xdeadbeef' } });
  });

  it('renders Binary values as hex strings', () => {
    expect(papiLocationToJson(fakeBinary('0x01020304'))).toEqual('0x01020304');
  });

  it('handles a full v3 cross-consensus location end-to-end', () => {
    const input = {
      parents: 2,
      interior: {
        type: 'X2',
        value: [
          { type: 'GlobalConsensus', value: { type: 'Ethereum', value: { chain_id: 1n } } },
          {
            type: 'AccountKey20',
            value: { network: null, key: fakeBinary('0xdac17f958d2ee523a2206206994597c13d831ec7') },
          },
        ],
      },
    };
    expect(papiLocationToJson(input)).toEqual({
      parents: 2,
      interior: {
        X2: [
          { GlobalConsensus: { Ethereum: { chainId: 1n } } },
          { AccountKey20: { network: null, key: '0xdac17f958d2ee523a2206206994597c13d831ec7' } },
        ],
      },
    });
  });

  it('lowercased-plain-variant nested inside GlobalConsensus matches stored shape', () => {
    expect(
      papiLocationToJson({
        parents: 2,
        interior: {
          type: 'X1',
          value: [{ type: 'GlobalConsensus', value: { type: 'Kusama', value: undefined } }],
        },
      }),
    ).toEqual({
      parents: 2,
      interior: { X1: [{ GlobalConsensus: { kusama: null } }] },
    });
  });
});
