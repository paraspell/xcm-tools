import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { type Location } from '../types';
import { convertMultilocationToUrl, convertXCMToUrls } from './convert';

describe('convert', () => {
  it('convert location to URL', () => {
    const location: Location = {
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

    const result = convertMultilocationToUrl(location);
    expect(result).toBe('./PalletInstance(50)/GeneralIndex(41)');
  });

  it('convert location to URL with parents', () => {
    const location: Location = {
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

    const result = convertMultilocationToUrl(location);
    expect(result).toBe('../../../PalletInstance(50)/GeneralIndex(41)');
  });

  it('convert location to URL with parachain interior', () => {
    const location: Location = {
      parents: '1',
      interior: {
        X1: {
          Parachain: '2006',
        },
      },
    };

    const result = convertMultilocationToUrl(location);
    expect(result).toBe('../Parachain(2006)');
  });

  it('convert location to URL with account interior', () => {
    const location: Location = {
      parents: '0',
      interior: {
        X1: {
          AccountId32: {
            network: null,
            id: '0x123',
          },
        },
      },
    };

    const result = convertMultilocationToUrl(location);
    expect(result).toBe('./AccountId32(null, 0x123)');
  });

  it('should convert location to URL with AccountIndex64 interior', () => {
    const location: Location = {
      parents: '0',
      interior: {
        X1: {
          AccountIndex64: {
            network: null,
            index: '100',
          },
        },
      },
    };

    const result = convertMultilocationToUrl(location);
    expect(result).toBe('./AccountIndex64(null, 100)');
  });

  it('should convert location to URL with AccountKey20 interior', () => {
    const location: Location = {
      parents: '0',
      interior: {
        X1: {
          AccountKey20: {
            network: null,
            key: '0x123',
          },
        },
      },
    };

    const result = convertMultilocationToUrl(location);
    expect(result).toBe('./AccountKey20(null, 0x123)');
  });

  it('should convert location to URL with GeneralKey interior', () => {
    const location: Location = {
      parents: '0',
      interior: {
        X1: {
          GeneralKey: {
            length: '10',
            data: '0xabc',
          },
        },
      },
    };
    const result = convertMultilocationToUrl(location);
    expect(result).toBe('./GeneralKey(10, 0xabc)');
  });

  it('should convert location to URL with OnlyChild interior', () => {
    const location: Location = {
      parents: '0',
      interior: {
        X1: {
          OnlyChild: 'child',
        },
      },
    };

    const result = convertMultilocationToUrl(location);
    expect(result).toBe('./OnlyChild(child)');
  });

  it('should convert location to URL with GlobalConsensus interior', () => {
    const location: Location = {
      parents: '0',
      interior: {
        X1: {
          GlobalConsensus: 'consensus',
        },
      },
    };

    const result = convertMultilocationToUrl(location);
    expect(result).toBe('./GlobalConsensus(consensus)');
  });

  it('convert location to URL with currency and amount location', () => {
    const location: Location = {
      parents: '0',
      interior: {
        X2: [{ PalletInstance: '50' }, { GeneralIndex: '1984' }],
      },
    };

    const result = convertMultilocationToUrl(location);
    expect(result).toBe('./PalletInstance(50)/GeneralIndex(1984)');
  });

  it('convert location to URL with currency and amount location with comma', () => {
    const location: Location = {
      parents: '0',
      interior: {
        X2: [{ PalletInstance: '50' }, { GeneralIndex: '1,984' }],
      },
    };

    const result = convertMultilocationToUrl(location);
    expect(result).toBe('./PalletInstance(50)/GeneralIndex(1984)');
  });

  it('convert location to URL from tx arguments with one location', () => {
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

  it('convert location to URL from tx arguments with multiple locations', () => {
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
      './AccountId32(null, 0xa)',
      './PalletInstance(50)/GeneralIndex(1984)',
    ]);
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

    const t = () => {
      convertXCMToUrls(xcmCallArguments);
    };

    expect(t).toThrowError(ZodError);
  });

  it('convert location to URL with plurality', () => {
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
