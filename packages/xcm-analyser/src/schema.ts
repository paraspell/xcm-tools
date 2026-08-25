import { z } from 'zod';

const NumericString = z
  .string()
  .regex(/^(?:\d{1,3}(?:,\d{3})*|\d+)$/)
  .transform((value) => value.replace(/,/g, ''));
const IntegerAsBigInt = z
  .union([NumericString, z.int(), z.bigint()], {
    error: 'Expected an integer, bigint or integer string',
  })
  .transform((value) => BigInt(value));
const createNumberUint = (bits: number) =>
  z
    .int()
    .nonnegative()
    .max(2 ** bits - 1);
const createBigIntUint = (bits: bigint) =>
  IntegerAsBigInt.pipe(
    z
      .bigint()
      .nonnegative()
      .max((1n << bits) - 1n),
  );
const Uint8 = createNumberUint(8);
const Uint32 = createNumberUint(32);
const Uint64 = createBigIntUint(64n);
const Uint128 = createBigIntUint(128n);
const hexStringError =
  "Invalid hex string format. Must start with '0x' and be followed by one or more hex characters (0-9, a-f, A-F).";
const HexString = z
  .templateLiteral(['0x', z.hex()], { error: hexStringError })
  .check(z.minLength(3, { error: hexStringError }));
const createFixedHexString = (bytes: number) => {
  const error = `Expected a ${bytes}-byte hex string`;
  return z.templateLiteral(['0x', z.hex()], { error }).check(z.length(2 + bytes * 2, { error }));
};
const HexString4 = createFixedHexString(4);
const HexString32 = createFixedHexString(32);
export const GLOBAL_CONSENSUS_NETWORKS = [
  'polkadot',
  'kusama',
  'westend',
  'rococo',
  'wococo',
  'bitcoinCore',
  'bitcoinCash',
  'polkadotBulletin',
] as const;

type TGlobalConsensusNetworkKey = (typeof GLOBAL_CONSENSUS_NETWORKS)[number];

type TGlobalConsensusUnitNetwork = {
  [K in TGlobalConsensusNetworkKey]: Record<K, null>;
}[TGlobalConsensusNetworkKey];

const capitalize = <T extends string>(value: T): Capitalize<T> =>
  (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<T>;

const GlobalConsensusUnitNetworkStringSchema = z.enum(GLOBAL_CONSENSUS_NETWORKS.map(capitalize));

const hasExactlyOneGlobalConsensusNetwork = (
  network: Partial<Record<TGlobalConsensusNetworkKey, null>>,
): network is TGlobalConsensusUnitNetwork => Object.keys(network).length === 1;

const GlobalConsensusUnitNetworkSchema = z
  .partialRecord(z.enum(GLOBAL_CONSENSUS_NETWORKS), z.null())
  .transform((network, ctx) => {
    if (hasExactlyOneGlobalConsensusNetwork(network)) return network;

    ctx.issues.push({
      code: 'custom',
      input: network,
      message: 'Expected exactly one GlobalConsensus unit network',
    });

    return z.NEVER;
  });

export const GlobalConsensusNetworkSchema = z.union([
  GlobalConsensusUnitNetworkStringSchema,
  GlobalConsensusUnitNetworkSchema,
  z.strictObject({ ByGenesis: HexString32 }),
  z.strictObject({
    ByFork: z.strictObject({
      blockNumber: Uint64,
      blockHash: HexString32,
    }),
  }),
  z.strictObject({
    Ethereum: z.strictObject({ chainId: Uint64 }),
  }),
]);

export const NetworkId = GlobalConsensusNetworkSchema.nullable();

export const JunctionParachain = z.strictObject({ Parachain: Uint32 });

export const JunctionAccountId32 = z.strictObject({
  AccountId32: z.strictObject({ network: NetworkId, id: HexString }),
});

export const JunctionAccountIndex64 = z.strictObject({
  AccountIndex64: z.strictObject({ network: NetworkId, index: Uint64 }),
});

export const JunctionAccountKey20 = z.strictObject({
  AccountKey20: z.strictObject({ network: NetworkId, key: HexString }),
});

export const JunctionPalletInstance = z.strictObject({ PalletInstance: Uint8 });

export const JunctionGeneralIndex = z.strictObject({ GeneralIndex: Uint128 });

export const JunctionGeneralKey = z.strictObject({
  GeneralKey: z.strictObject({ length: Uint8, data: HexString }),
});

export const JunctionOnlyChild = z.strictObject({ OnlyChild: z.string().nullable() });

const BodyId = z.union([
  z.string().nullable(),
  z.strictObject({ Moniker: HexString4 }),
  z.strictObject({ Index: Uint32 }),
]);

const BodyPartFraction = z.strictObject({ nom: Uint32, denom: Uint32 });

const BodyPart = z.union([
  z.string().nullable(),
  z.strictObject({ Members: z.strictObject({ count: Uint32 }) }),
  z.strictObject({ Fraction: BodyPartFraction }),
  z.strictObject({ AtLeastProportion: BodyPartFraction }),
  z.strictObject({ MoreThanProportion: BodyPartFraction }),
]);

export const JunctionPlurality = z.strictObject({
  Plurality: z.strictObject({ id: BodyId, part: BodyPart }),
});

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
  { error: 'Expected exactly one junction (X1-X8)' },
);

export const InteriorSchema = z.union(
  [z.literal('Here'), z.strictObject({ Here: z.literal(null) }), Junctions],
  { error: "Expected 'Here' or junctions (X1-X8)" },
);

export const LocationSchema = z.strictObject({
  parents: Uint8,
  interior: InteriorSchema,
});
