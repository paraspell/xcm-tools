import { z } from 'zod';

export type JunctionType =
  | 'Parachain'
  | 'AccountId32'
  | 'AccountIndex64'
  | 'AccountKey20'
  | 'PalletInstance'
  | 'GeneralIndex'
  | 'GeneralKey'
  | 'OnlyChild'
  | 'Plurality'
  | 'GlobalConsensus';

const NetworkId = z.string().nullable();
const BodyId = z.string().nullable();
const BodyPart = z.string().nullable();
const StringOrNumber = z
  .string()
  .regex(/^(?:\d{1,3}(?:,\d{3})*|\d+)$/)
  .transform((s) => s.replace(/,/g, ''))
  .or(z.number())
  .or(z.bigint());
const HexString = z.string();

const JunctionParachain = z.object({ Parachain: StringOrNumber });
const JunctionAccountId32 = z.object({
  AccountId32: z.object({ network: NetworkId, id: HexString }),
});
const JunctionAccountIndex64 = z.object({
  AccountIndex64: z.object({ network: NetworkId, index: StringOrNumber }),
});
const JunctionAccountKey20 = z.object({
  AccountKey20: z.object({ network: NetworkId, key: HexString }),
});
const JunctionPalletInstance = z.object({ PalletInstance: StringOrNumber });
const JunctionGeneralIndex = z.object({ GeneralIndex: StringOrNumber });
const JunctionGeneralKey = z.object({
  GeneralKey: z.object({ length: StringOrNumber, data: HexString }),
});
const JunctionOnlyChild = z.object({ OnlyChild: z.string() });
const JunctionPlurality = z.object({
  Plurality: z.object({ id: BodyId, part: BodyPart }),
});
const JunctionGlobalConsensus = z.object({ GlobalConsensus: NetworkId });

const JunctionSchema = z.union([
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
  z.object({
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
    X9: z
      .tuple([
        JunctionSchema,
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
    X10: z
      .tuple([
        JunctionSchema,
        JunctionSchema,
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
  }),
);

export const MultiLocationSchema = z.object({
  parents: StringOrNumber,
  interior: z.union([Junctions, z.literal('Here')]),
});

export type MultiLocation = z.infer<typeof MultiLocationSchema>;
export type Junction = z.infer<typeof JunctionSchema>;
