import { z } from 'zod';

const NetworkId = z.string().nullable();
const BodyId = z.string().nullable();
const BodyPart = z.string().nullable();
const StringOrNumber = z
  .string()
  .regex(/^(?:\d{1,3}(?:,\d{3})*|\d+)$/)
  .transform((s) => s.replace(/,/g, ''))
  .or(z.number());
const StringOrNumberOrBigInt = StringOrNumber.or(z.bigint());
const HexString = z.string().regex(/^0x[0-9a-fA-F]+$/, {
  message:
    "Invalid hex string format. Must start with '0x' and be followed by one or more hex characters (0-9, a-f, A-F).",
});

export const JunctionParachain = z.object({ Parachain: StringOrNumberOrBigInt });

export const JunctionAccountId32 = z.object({
  AccountId32: z.object({ network: NetworkId, id: HexString }),
});

export const JunctionAccountIndex64 = z.object({
  AccountIndex64: z.object({ network: NetworkId, index: StringOrNumberOrBigInt }),
});

export const JunctionAccountKey20 = z.object({
  AccountKey20: z.object({ network: NetworkId, key: HexString }),
});

export const JunctionPalletInstance = z.object({ PalletInstance: StringOrNumberOrBigInt });

export const JunctionGeneralIndex = z.object({ GeneralIndex: StringOrNumberOrBigInt });

export const JunctionGeneralKey = z.object({
  GeneralKey: z.object({ length: StringOrNumberOrBigInt, data: HexString }),
});

export const JunctionOnlyChild = z.object({ OnlyChild: z.string() });

export const JunctionPlurality = z.object({
  Plurality: z.object({ id: BodyId, part: BodyPart }),
});

export const JunctionGlobalConsensus = z.object({ GlobalConsensus: NetworkId });

export const JunctionSchema = z.union([
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
]);

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
    .strict(),
);

export const InteriorSchema = z.union([
  z.literal('Here'),
  z.object({ Here: z.literal(null) }),
  Junctions,
]);

export const MultiLocationSchema = z.object({
  parents: StringOrNumber,
  interior: InteriorSchema,
});
