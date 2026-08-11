import { z } from 'zod';

const NetworkId = z.string().nullable();
const BodyId = z.string().nullable();
const BodyPart = z.string().nullable();
const StringOrNumber = z.union(
  [
    z
      .string()
      .regex(/^(?:\d{1,3}(?:,\d{3})*|\d+)$/)
      .transform((s) => s.replace(/,/g, '')),
    z.number(),
  ],
  { error: 'Expected a number or numeric string' },
);
const StringOrNumberOrBigInt = StringOrNumber.or(z.bigint());
const hexStringError =
  "Invalid hex string format. Must start with '0x' and be followed by one or more hex characters (0-9, a-f, A-F).";
const HexString = z
  .templateLiteral(['0x', z.hex()], { error: hexStringError })
  .check(z.minLength(3, { error: hexStringError }));
const HexString32 = z
  .templateLiteral(['0x', z.hex()], { error: 'Expected a 32-byte hex string' })
  .check(z.length(66, { error: 'Expected a 32-byte hex string' }));

export const JunctionParachain = z.strictObject({ Parachain: StringOrNumberOrBigInt });

export const JunctionAccountId32 = z.strictObject({
  AccountId32: z.strictObject({ network: NetworkId, id: HexString }),
});

export const JunctionAccountIndex64 = z.strictObject({
  AccountIndex64: z.strictObject({ network: NetworkId, index: StringOrNumberOrBigInt }),
});

export const JunctionAccountKey20 = z.strictObject({
  AccountKey20: z.strictObject({ network: NetworkId, key: HexString }),
});

export const JunctionPalletInstance = z.strictObject({ PalletInstance: StringOrNumberOrBigInt });

export const JunctionGeneralIndex = z.strictObject({ GeneralIndex: StringOrNumberOrBigInt });

export const JunctionGeneralKey = z.strictObject({
  GeneralKey: z.strictObject({ length: StringOrNumberOrBigInt, data: HexString }),
});

export const JunctionOnlyChild = z.strictObject({ OnlyChild: z.string() });

export const JunctionPlurality = z.strictObject({
  Plurality: z.strictObject({ id: BodyId, part: BodyPart }),
});

export const GlobalConsensusNetworkSchema = z.union([
  z.enum([
    'Polkadot',
    'Kusama',
    'Westend',
    'Rococo',
    'Wococo',
    'BitcoinCore',
    'BitcoinCash',
    'PolkadotBulletin',
  ]),
  z.strictObject({ ByGenesis: HexString32 }),
  z.strictObject({
    ByFork: z.strictObject({
      blockNumber: StringOrNumberOrBigInt,
      blockHash: HexString32,
    }),
  }),
  z.strictObject({
    Ethereum: z.strictObject({ chainId: StringOrNumberOrBigInt }),
  }),
]);

export const JunctionGlobalConsensus = z.strictObject({
  GlobalConsensus: GlobalConsensusNetworkSchema,
});

export const JunctionSchema = z.union(
  [
    JunctionParachain,
    JunctionAccountId32,
    JunctionAccountIndex64,
    JunctionAccountKey20,
    JunctionPalletInstance,
    JunctionGeneralIndex,
    JunctionGeneralKey,
    JunctionOnlyChild,
    JunctionPlurality,
    JunctionGlobalConsensus,
  ],
  {
    error:
      'Expected a valid junction (Parachain, AccountId32, AccountIndex64, AccountKey20, PalletInstance, GeneralIndex, GeneralKey, OnlyChild, Plurality or GlobalConsensus)',
  },
);

const Junctions = z.union(
  [
    z.strictObject({ X1: z.union([JunctionSchema, z.tuple([JunctionSchema])]) }),
    z.strictObject({ X2: z.tuple([JunctionSchema, JunctionSchema]) }),
    z.strictObject({ X3: z.tuple([JunctionSchema, JunctionSchema, JunctionSchema]) }),
    z.strictObject({
      X4: z.tuple([JunctionSchema, JunctionSchema, JunctionSchema, JunctionSchema]),
    }),
    z.strictObject({
      X5: z.tuple([JunctionSchema, JunctionSchema, JunctionSchema, JunctionSchema, JunctionSchema]),
    }),
    z.strictObject({
      X6: z.tuple([
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
      ]),
    }),
    z.strictObject({
      X7: z.tuple([
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
      ]),
    }),
    z.strictObject({
      X8: z.tuple([
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
      ]),
    }),
  ],
  { error: 'Expected exactly one junction (X1–X8)' },
);

export const InteriorSchema = z.union(
  [z.literal('Here'), z.strictObject({ Here: z.literal(null) }), Junctions],
  { error: "Expected 'Here' or junctions (X1–X8)" },
);

export const LocationSchema = z.strictObject({
  parents: StringOrNumber,
  interior: InteriorSchema,
});
