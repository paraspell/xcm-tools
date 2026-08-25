import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { GLOBAL_CONSENSUS_NETWORKS } from '../schema';
import { type Location } from '../types';
import { convertLocationToUrl, convertLocationToUrlJson, convertXCMToUrls } from './convert';

const mockHash: `0x${string}` = `0x${'ab'.repeat(32)}`;

describe('convert', () => {
  it.each([
    [{ parents: 0, interior: 'Here' }, './'],
    [{ parents: 2, interior: { Here: null } }, '../../'],
  ] as const)('convert location with Here interior to URL', (location, expected) => {
    expect(convertLocationToUrl(location)).toBe(expected);
  });

  it('convert location to URL', () => {
    const location: Location = {
      parents: 0,
      interior: {
        X2: [
          {
            PalletInstance: 50,
          },
          {
            GeneralIndex: '41',
          },
        ],
      },
    };

    const result = convertLocationToUrl(location);
    expect(result).toBe('./PalletInstance(50)/GeneralIndex(41)');
  });

  it('convert location to URL with parents', () => {
    const location: Location = {
      parents: 3,
      interior: {
        X2: [
          {
            PalletInstance: 50,
          },
          {
            GeneralIndex: '41',
          },
        ],
      },
    };

    const result = convertLocationToUrl(location);
    expect(result).toBe('../../../PalletInstance(50)/GeneralIndex(41)');
  });

  it('rejects an unbounded parent count before constructing the URL', () => {
    expect(() =>
      convertLocationToUrl({
        parents: 89_000_000,
        interior: { X1: { Parachain: 2000 } },
      }),
    ).toThrow(ZodError);
  });

  it('convert location to URL with parachain interior', () => {
    const location: Location = {
      parents: 1,
      interior: {
        X1: {
          Parachain: 2006,
        },
      },
    };

    const result = convertLocationToUrl(location);
    expect(result).toBe('../Parachain(2006)');
  });

  it('convert location to URL with account interior', () => {
    const location: Location = {
      parents: 0,
      interior: {
        X1: {
          AccountId32: {
            network: null,
            id: '0x123',
          },
        },
      },
    };

    const result = convertLocationToUrl(location);
    expect(result).toBe('./AccountId32(null, 0x123)');
  });

  it('should convert location to URL with AccountIndex64 interior', () => {
    const location: Location = {
      parents: 0,
      interior: {
        X1: {
          AccountIndex64: {
            network: null,
            index: '100',
          },
        },
      },
    };

    const result = convertLocationToUrl(location);
    expect(result).toBe('./AccountIndex64(null, 100)');
  });

  it('should convert location to URL with AccountKey20 interior', () => {
    const location: Location = {
      parents: 0,
      interior: {
        X1: {
          AccountKey20: {
            network: null,
            key: '0x123',
          },
        },
      },
    };

    const result = convertLocationToUrl(location);
    expect(result).toBe('./AccountKey20(null, 0x123)');
  });

  it('should convert location to URL with GeneralKey interior', () => {
    const location: Location = {
      parents: 0,
      interior: {
        X1: {
          GeneralKey: {
            length: 10,
            data: '0xabc',
          },
        },
      },
    };
    const result = convertLocationToUrl(location);
    expect(result).toBe('./GeneralKey(10, 0xabc)');
  });

  it('should convert location to URL with OnlyChild interior', () => {
    const location: Location = {
      parents: 0,
      interior: {
        X1: {
          OnlyChild: 'child',
        },
      },
    };

    const result = convertLocationToUrl(location);
    expect(result).toBe('./OnlyChild(child)');
  });

  it('should convert location to URL with GlobalConsensus interior', () => {
    const location: Location = {
      parents: 0,
      interior: {
        X1: {
          GlobalConsensus: { polkadot: null },
        },
      },
    };

    const result = convertLocationToUrl(location);
    expect(result).toBe('./GlobalConsensus(Polkadot)');
  });

  it('should convert a plain string GlobalConsensus network', () => {
    expect(
      convertLocationToUrl({
        parents: 0,
        interior: { X1: { GlobalConsensus: 'Polkadot' } },
      }),
    ).toBe('./GlobalConsensus(Polkadot)');
  });

  it.each([
    [{ ByGenesis: mockHash }, `ByGenesis(${mockHash})`],
    [
      { ByFork: { blockNumber: 123, blockHash: mockHash } },
      `ByFork(blockNumber: 123, blockHash: ${mockHash})`,
    ],
    [{ Ethereum: { chainId: 1 } }, 'Ethereum(chainId: 1)'],
  ] as const)('should preserve GlobalConsensus payload data for %#', (network, expected) => {
    expect(
      convertLocationToUrl({
        parents: 0,
        interior: { X1: { GlobalConsensus: network } },
      }),
    ).toBe(`./GlobalConsensus(${expected})`);
  });

  it('should preserve GlobalConsensus payload data from JSON', () => {
    expect(
      convertLocationToUrlJson(
        JSON.stringify({
          parents: 0,
          interior: { X1: { GlobalConsensus: { Ethereum: { chainId: 1 } } } },
        }),
      ),
    ).toBe('./GlobalConsensus(Ethereum(chainId: 1))');
  });

  it.each(
    GLOBAL_CONSENSUS_NETWORKS.map(
      (network) =>
        [{ [network]: null }, network.charAt(0).toUpperCase() + network.slice(1)] as const,
    ),
  )('should support codec-style GlobalConsensus unit object %#', (network, expected) => {
    expect(
      convertLocationToUrl({
        parents: 0,
        interior: { X1: { GlobalConsensus: network } },
      }),
    ).toBe(`./GlobalConsensus(${expected})`);
  });

  it('should preserve GlobalConsensus payload data in nested XCM arguments', () => {
    expect(
      convertXCMToUrls([
        {
          V5: {
            parents: 0,
            interior: { X1: [{ GlobalConsensus: { Ethereum: { chainId: 1 } } }] },
          },
        },
      ]),
    ).toEqual(['./GlobalConsensus(Ethereum(chainId: 1))']);
  });

  it('convert location to URL with currency and amount location', () => {
    const location: Location = {
      parents: 0,
      interior: {
        X2: [{ PalletInstance: 50 }, { GeneralIndex: '1984' }],
      },
    };

    const result = convertLocationToUrl(location);
    expect(result).toBe('./PalletInstance(50)/GeneralIndex(1984)');
  });

  it('convert location to URL with currency and amount location with comma', () => {
    const location: Location = {
      parents: 0,
      interior: {
        X2: [{ PalletInstance: 50 }, { GeneralIndex: '1,984' }],
      },
    };

    const result = convertLocationToUrl(location);
    expect(result).toBe('./PalletInstance(50)/GeneralIndex(1984)');
  });

  it('convert location to URL from tx arguments with one location', () => {
    const xcmCallArguments = [
      '1', // currency_id for KSM
      '100000000000', // amount - 0.1 KSM
      {
        // dest
        V3: {
          parents: 1,
          interior: {
            X2: [
              {
                Parachain: 2001, // BifrostKusama paraId
              },
              {
                AccountId32: {
                  network: null,
                  id: '0x84fc49ce30071ea611731838cc7736113c1ec68fbc47119be8a0805066df9b2b',
                },
              },
            ],
          },
        },
      },
      'Unlimited', // dest_weight_limit
    ];

    const result = convertXCMToUrls(xcmCallArguments);
    expect(result).toStrictEqual([
      '../Parachain(2001)/AccountId32(null, 0x84fc49ce30071ea611731838cc7736113c1ec68fbc47119be8a0805066df9b2b)',
    ]);
  });

  it('convert location to URL from tx arguments with multiple locations', () => {
    const xcmCallArguments = [
      {
        V3: {
          parents: 1,
          interior: {
            X1: {
              Parachain: 2006,
            },
          },
        },
      },
      {
        V3: {
          parents: 0,
          interior: {
            X1: {
              AccountId32: {
                network: null,
                id: '0xa',
              },
            },
          },
        },
      },
      {
        V3: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [{ PalletInstance: 50 }, { GeneralIndex: '1984' }],
                },
              },
            },
            fun: {
              Fungible: 'amount',
            },
          },
        ],
      },
    ];

    const result = convertXCMToUrls(xcmCallArguments);
    expect(result).toStrictEqual([
      '../Parachain(2006)',
      './AccountId32(null, 0xa)',
      './PalletInstance(50)/GeneralIndex(1984)',
    ]);
  });

  it('convert location to URL from a single argument containing multiple locations', () => {
    const xcmCallArguments = [
      {
        V3: [
          {
            id: {
              Concrete: {
                parents: 1,
                interior: 'Here',
              },
            },
            fun: {
              Fungible: '1000000000',
            },
          },
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [{ PalletInstance: 50 }, { GeneralIndex: '1984' }],
                },
              },
            },
            fun: {
              Fungible: '5000000',
            },
          },
        ],
      },
    ];

    const result = convertXCMToUrls(xcmCallArguments);
    expect(result).toStrictEqual(['../', './PalletInstance(50)/GeneralIndex(1984)']);
  });

  it('throws ZodError when an argument mixes valid and invalid locations', () => {
    const xcmCallArguments = [
      {
        V3: [
          {
            id: {
              Concrete: {
                parents: 1,
                interior: 'Here',
              },
            },
            fun: {
              Fungible: '1000000000',
            },
          },
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X1: {
                    AccountId32: {
                      network: { Any: null },
                      id: '0x1234',
                    },
                  },
                },
              },
            },
            fun: {
              Fungible: '5000000',
            },
          },
        ],
      },
    ];

    const t = () => {
      convertXCMToUrls(xcmCallArguments);
    };

    expect(t).toThrow(ZodError);
  });

  it.each([
    [{ polkadot: null }, 'Polkadot'],
    [{ ByGenesis: mockHash }, `ByGenesis(${mockHash})`],
    [
      { ByFork: { blockNumber: 1, blockHash: mockHash } },
      `ByFork(blockNumber: 1, blockHash: ${mockHash})`,
    ],
    [{ Ethereum: { chainId: 1 } }, 'Ethereum(chainId: 1)'],
  ] as const)('convert location with object network in AccountId32 to URL', (network, expected) => {
    const location: Location = {
      parents: 0,
      interior: {
        X1: {
          AccountId32: {
            network,
            id: '0x1234',
          },
        },
      },
    };

    expect(convertLocationToUrl(location)).toBe(`./AccountId32(${expected}, 0x1234)`);
  });

  it('convert location to URL from tx arguments with no locations', () => {
    const xcmCallArguments = [
      '1', // currency_id for KSM
      '100000000000', // amount - 0.1 KSM
      'Unlimited', // dest_weight_limit
    ];

    const result = convertXCMToUrls(xcmCallArguments);
    expect(result).toStrictEqual([]);
  });

  it('convert location to URL with X2 with 3 elements', () => {
    const xcmCallArguments = [
      {
        V3: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [
                    {
                      Parachain: 2001, // BifrostKusama paraId
                    },
                    {
                      AccountId32: {
                        network: 'Polkadot',
                        id: '0x84fc49ce30071ea611731838cc7736113c1ec68fbc47119be8a0805066df9b2b',
                      },
                    },
                    {
                      Plurality: {
                        id: 'Unit',
                        part: null,
                      },
                    },
                  ],
                },
              },
            },
            fun: {
              Fungible: 'amount',
            },
          },
        ],
      },
    ];

    const t = () => {
      convertXCMToUrls(xcmCallArguments);
    };

    expect(t).toThrow(ZodError);
  });

  it('convert location to URL with plurality', () => {
    const xcmCallArguments = [
      {
        V3: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [
                    {
                      AccountId32: {
                        network: 'Polkadot',
                        id: '0x84fc49ce30071ea611731838cc7736113c1ec68fbc47119be8a0805066df9b2b',
                      },
                    },
                    {
                      Plurality: {
                        id: 'Unit',
                        part: null,
                      },
                    },
                  ],
                },
              },
            },
            fun: {
              Fungible: 'amount',
            },
          },
        ],
      },
    ];

    const result = convertXCMToUrls(xcmCallArguments);
    expect(result).toStrictEqual([
      './AccountId32(Polkadot, 0x84fc49ce30071ea611731838cc7736113c1ec68fbc47119be8a0805066df9b2b)/Plurality(Unit, null)',
    ]);
  });

  it.each([
    [
      { id: { Index: 42 }, part: { Members: { count: 3 } } },
      './Plurality(Index(42), Members(count: 3))',
    ],
    [
      { id: { Moniker: '0x646f7421' }, part: { Fraction: { nom: 1, denom: 2 } } },
      './Plurality(Moniker(0x646f7421), Fraction(nom: 1, denom: 2))',
    ],
    [
      { id: 'Technical', part: { AtLeastProportion: { nom: 1, denom: 3 } } },
      './Plurality(Technical, AtLeastProportion(nom: 1, denom: 3))',
    ],
    [
      { id: null, part: { MoreThanProportion: { nom: 2, denom: 3 } } },
      './Plurality(null, MoreThanProportion(nom: 2, denom: 3))',
    ],
  ] as const)('convert location with structured plurality body to URL', (plurality, expected) => {
    const location: Location = {
      parents: 0,
      interior: {
        X1: {
          Plurality: plurality,
        },
      },
    };

    expect(convertLocationToUrl(location)).toBe(expected);
  });
});
