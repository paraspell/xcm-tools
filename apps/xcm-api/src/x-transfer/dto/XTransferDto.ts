import { Version } from '@paraspell/sdk';
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
    X1: z.union([JunctionSchema, z.array(JunctionSchema)]).optional(),
    X2: z.tuple([JunctionSchema, JunctionSchema]).optional(),
    X3: z.tuple([JunctionSchema, JunctionSchema, JunctionSchema]).optional(),
    X4: z
      .tuple([JunctionSchema, JunctionSchema, JunctionSchema, JunctionSchema])
      .optional(),
    X5: z
      .tuple([
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
        JunctionSchema,
      ])
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
  }),
);

export const MultiLocationSchema = z.object({
  parents: StringOrNumber,
  interior: z.union([Junctions, z.literal('Here')]),
});

export type MultiLocation = z.infer<typeof MultiLocationSchema>;
export type Junction = z.infer<typeof JunctionSchema>;

export const MultiAssetSchemaV3 = z.object({
  id: z.object({
    Concrete: MultiLocationSchema,
  }),
  fun: z.object({
    Fungible: StringOrNumber,
  }),
});

export const MultiAssetSchemaV4 = z.object({
  id: MultiLocationSchema,
  fun: z.object({
    Fungible: StringOrNumber,
  }),
});

export const MultiAssetSchema = z.union([
  MultiAssetSchemaV3,
  MultiAssetSchemaV4,
]);

export type TMultiAsset = z.infer<typeof MultiAssetSchema>;

const CurrencySchema = z
  .union([z.string(), MultiLocationSchema, z.array(MultiAssetSchema)])
  .optional();

const versionValues = Object.values(Version) as [Version, ...Version[]];

export const XTransferDtoSchema = z.object({
  from: z.string().optional(),
  to: z.union([z.string().optional(), MultiLocationSchema]),
  amount: z.union([
    z.string().refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      {
        message: 'Amount must be a positive number',
      },
    ),
    z.number().positive({ message: 'Amount must be a positive number' }),
  ]),
  address: z.union([
    z.string().min(1, { message: 'Address is required' }),
    MultiLocationSchema,
  ]),
  currency: CurrencySchema,
  xcmVersion: z.enum(versionValues).optional(),
});

export type XTransferDto = z.infer<typeof XTransferDtoSchema>;
