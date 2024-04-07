import { describe, expect, it } from 'vitest';
import { type MultiLocation } from '../types';
import { convertMultilocationToUrl, convertXCMToUrls } from './convert';
import { ZodError } from 'zod';

describe('convert', () => {
  it('convert multilocation to URL', () => {
    const multilocation: MultiLocation = {
      parents: '0',
      interior: {
        X2: [
          {
            PalletInstance: '50',
          },
          {
            GeneralIndex: '41',
          },
        ],
      },
    };

    const result = convertMultilocationToUrl(multilocation);
    expect(result).toBe('./PalletInstance(50)/GeneralIndex(41)');
  });

  it('convert multilocation to URL with parents', () => {
    const multilocation: MultiLocation = {
      parents: '3',
      interior: {
        X2: [
          {
            PalletInstance: '50',
          },
          {
            GeneralIndex: '41',
          },
        ],
      },
    };

    const result = convertMultilocationToUrl(multilocation);
    expect(result).toBe('../../../PalletInstance(50)/GeneralIndex(41)');
  });

  it('convert multilocation to URL with parachain interior', () => {
    const multilocation: MultiLocation = {
      parents: '1',
      interior: {
        X1: {
          Parachain: '2006',
        },
      },
    };

    const result = convertMultilocationToUrl(multilocation);
    expect(result).toBe('../Parachain(2006)');
  });

  it('convert multilocation to URL with account interior', () => {
    const multilocation: MultiLocation = {
      parents: '0',
      interior: {
        X1: {
          AccountId32: {
            network: null,
            id: 'accountID',
          },
        },
      },
    };

    const result = convertMultilocationToUrl(multilocation);
    expect(result).toBe('./AccountId32(null, accountID)');
  });

  it('convert multilocation to URL with currency and amout multilocation', () => {
    const multilocation: MultiLocation = {
      parents: '0',
      interior: {
        X2: [{ PalletInstance: '50' }, { GeneralIndex: '1984' }],
      },
    };

    const result = convertMultilocationToUrl(multilocation);
    expect(result).toBe('./PalletInstance(50)/GeneralIndex(1984)');
  });

  it('convert multilocation to URL from tx arguments with one multilocation', () => {
    const xcmCallArguments = [
      '1', // currency_id for KSM
      '100000000000', // amount - 0.1 KSM
      {
        // dest
        V3: {
          parents: '1',
          interior: {
            X2: [
              {
                Parachain: '2001', // BifrostKusama paraId
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

  it('convert multilocation to URL from tx arguments with multiple multilocations', () => {
    const xcmCallArguments = [
      {
        V3: {
          parents: '1',
          interior: {
            X1: {
              Parachain: '2006',
            },
          },
        },
      },
      {
        V3: {
          parents: '0',
          interior: {
            X1: {
              AccountId32: {
                network: null,
                id: 'accountID',
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
                parents: '0',
                interior: {
                  X2: [{ PalletInstance: '50' }, { GeneralIndex: '1984' }],
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
      './AccountId32(null, accountID)',
      './PalletInstance(50)/GeneralIndex(1984)',
    ]);
  });

  it('convert multilocation to URL from tx arguments with no multilocations', () => {
    const xcmCallArguments = [
      '1', // currency_id for KSM
      '100000000000', // amount - 0.1 KSM
      'Unlimited', // dest_weight_limit
    ];

    const result = convertXCMToUrls(xcmCallArguments);
    expect(result).toStrictEqual([]);
  });

  it('convert multilocation to URL with X2 with 3 elements', () => {
    const xcmCallArguments = [
      {
        V3: [
          {
            id: {
              Concrete: {
                parents: '0',
                interior: {
                  X2: [
                    {
                      Parachain: '2001', // BifrostKusama paraId
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

    const t = (): any => {
      convertXCMToUrls(xcmCallArguments);
    };

    expect(t).toThrowError(ZodError);
  });

  it('convert multilocation to URL with plurality', () => {
    const xcmCallArguments = [
      {
        V3: [
          {
            id: {
              Concrete: {
                parents: '0',
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
});
