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
const boundedUnsignedInteger = (max: bigint, bits: number) =>
  StringOrNumberOrBigInt.refine(
    (value) => {
      if (typeof value === 'number') {
        return Number.isSafeInteger(value) && value >= 0 && BigInt(value) <= max;
      }

      const integer = typeof value === 'bigint' ? value : BigInt(value);
      return integer >= BigInt(0) && integer <= max;
    },
    { error: `Expected an unsigned ${bits}-bit integer` },
  );
const U8StringOrNumberOrBigInt = boundedUnsignedInteger(BigInt('255'), 8);
const U32StringOrNumberOrBigInt = boundedUnsignedInteger(BigInt('4294967295'), 32);
const U64StringOrNumberOrBigInt = boundedUnsignedInteger(BigInt('18446744073709551615'), 64);
const U128StringOrNumberOrBigInt = boundedUnsignedInteger(
  BigInt('340282366920938463463374607431768211455'),
  128,
);
const HexString = z.string().regex(/^0x[0-9a-fA-F]+$/, {
  message:
    "Invalid hex string format. Must start with '0x' and be followed by one or more hex characters (0-9, a-f, A-F).",
});

export const JunctionParachain = z.object({ Parachain: U32StringOrNumberOrBigInt });

export const JunctionAccountId32 = z.object({
  AccountId32: z.object({ network: NetworkId, id: HexString }),
});

export const JunctionAccountIndex64 = z.object({
  AccountIndex64: z.object({ network: NetworkId, index: U64StringOrNumberOrBigInt }),
});

export const JunctionAccountKey20 = z.object({
  AccountKey20: z.object({ network: NetworkId, key: HexString }),
});

export const JunctionPalletInstance = z.object({ PalletInstance: U8StringOrNumberOrBigInt });

export const JunctionGeneralIndex = z.object({ GeneralIndex: U128StringOrNumberOrBigInt });

export const JunctionGeneralKey = z.object({
  GeneralKey: z.object({ length: U8StringOrNumberOrBigInt, data: HexString }),
});

export const JunctionOnlyChild = z.object({ OnlyChild: z.string() });

export const JunctionPlurality = z.object({
  Plurality: z.object({ id: BodyId, part: BodyPart }),
});

export const GlobalConsensusNetworkSchema = z.union([
  z.object({
    Ethereum: z.object({
      chainId: z.number(),
    }),
  }),
  z.record(z.string(), z.any()),
  z.string(),
]);

export const JunctionGlobalConsensus = z.object({ GlobalConsensus: GlobalConsensusNetworkSchema });

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

const Junctions = z.lazy(() =>
  z
    .object({
      X1: z.union([JunctionSchema, z.tuple([JunctionSchema])]).optional(),
      X2: z.tuple([JunctionSchema, JunctionSchema]).optional(),
      X3: z.tuple([JunctionSchema, JunctionSchema, JunctionSchema]).optional(),
      X4: z.tuple([JunctionSchema, JunctionSchema, JunctionSchema, JunctionSchema]).optional(),
      X5: z
        .tuple([JunctionSchema, JunctionSchema, JunctionSchema, JunctionSchema, JunctionSchema])
        .optional(),
      X6: z
        .tuple([
          JunctionSchema,
          JunctionSchema,
          JunctionSchema,
          JunctionSchema,
          JunctionSchema,
          JunctionSchema,
        ])
        .optional(),
      X7: z
        .tuple([
          JunctionSchema,
          JunctionSchema,
          JunctionSchema,
          JunctionSchema,
          JunctionSchema,
          JunctionSchema,
          JunctionSchema,
        ])
        .optional(),
      X8: z
        .tuple([
          JunctionSchema,
          JunctionSchema,
          JunctionSchema,
          JunctionSchema,
          JunctionSchema,
          JunctionSchema,
          JunctionSchema,
          JunctionSchema,
        ])
        .optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).length === 1, {
      error: 'Expected exactly one junction (X1–X8)',
    }),
);

export const InteriorSchema = z.union(
  [z.literal('Here'), z.object({ Here: z.literal(null) }), Junctions],
  { error: "Expected 'Here' or junctions (X1–X8)" },
);

export const LocationSchema = z.object({
  parents: StringOrNumber,
  interior: InteriorSchema,
});
