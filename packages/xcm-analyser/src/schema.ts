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
const HexString = z.string().regex(/^0x[0-9a-fA-F]+$/, {
  message:
    "Invalid hex string format. Must start with '0x' and be followed by one or more hex characters (0-9, a-f, A-F).",
});

export const JunctionParachain = z.object({ Parachain: StringOrNumberOrBigInt }).refine(
  (val) => {
    const v = val.Parachain;
    if (typeof v === 'bigint') return v >= 0n && v <= 4_294_967_295n;
    const n = Number(v);
    return Number.isSafeInteger(n) && n >= 0 && n <= 4_294_967_295;
  },
  { message: 'Parachain must be a u32 integer (0 to 4_294_967_295)' },
);

export const JunctionAccountId32 = z.object({
  AccountId32: z.object({ network: NetworkId, id: HexString }),
});

export const JunctionAccountIndex64 = z.object({
  AccountIndex64: z.object({ network: NetworkId, index: StringOrNumberOrBigInt }),
}).refine(
  (val) => {
    const v = val.AccountIndex64.index;
    if (typeof v === 'bigint') return v >= 0n && v <= 18_446_744_073_709_551_615n;
    const n = Number(v);
    return Number.isSafeInteger(n) && n >= 0;
  },
  { message: 'AccountIndex64.index must be a u64 integer (0 to 18_446_744_073_709_551_615)' },
);

export const JunctionAccountKey20 = z.object({
  AccountKey20: z.object({ network: NetworkId, key: HexString }),
});

export const JunctionPalletInstance = z.object({ PalletInstance: StringOrNumberOrBigInt }).refine(
  (val) => {
    const v = val.PalletInstance;
    if (typeof v === 'bigint') return v >= 0n && v <= 255n;
    const n = Number(v);
    return Number.isSafeInteger(n) && n >= 0 && n <= 255;
  },
  { message: 'PalletInstance must be a u8 integer (0 to 255)' },
);

const U128_MAX = 340_282_366_920_938_463_463_374_607_431_768_211_455n;

export const JunctionGeneralIndex = z.object({ GeneralIndex: StringOrNumberOrBigInt }).refine(
  (val) => {
    const v = val.GeneralIndex;
    if (typeof v === 'bigint') return v >= 0n && v <= U128_MAX;
    const n = Number(v);
    return Number.isSafeInteger(n) && n >= 0;
  },
  { message: 'GeneralIndex must be a u128 integer (0 to 2^128-1)' },
);

export const JunctionGeneralKey = z.object({
  GeneralKey: z.object({ length: StringOrNumberOrBigInt, data: HexString }),
}).refine(
  (val) => {
    const v = val.GeneralKey.length;
    if (typeof v === 'bigint') return v >= 0n && v <= 4_294_967_295n;
    const n = Number(v);
    return Number.isSafeInteger(n) && n >= 0 && n <= 4_294_967_295;
  },
  { message: 'GeneralKey.length must be a u32 integer (0 to 4_294_967_295)' },
);

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
