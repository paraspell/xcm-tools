import { z } from 'zod';
import { Version } from '@paraspell/sdk';
import { MultiLocationSchema, JunctionSchema } from '@paraspell/xcm-analyser';
import { validateAmount } from '../../utils/validateAmount.js';

const StringOrNumber = z
  .string()
  .regex(/^(?:\d{1,3}(?:,\d{3})*|\d+)$/)
  .transform((s) => s.replace(/,/g, ''))
  .or(z.number())
  .or(z.bigint());

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

const MultiAssetWithFeeSchema = MultiAssetSchema.and(
  z.object({
    isFeeAsset: z.boolean().optional(),
  }),
);

const AmountSchema = z.union([
  z.string().refine(validateAmount, {
    message: 'Amount must be a positive number',
  }),
  z.number().positive({ message: 'Amount must be a positive number' }),
]);

export const SymbolSpecifierSchema = z.object({
  type: z.enum(['Native', 'Foreign', 'ForeignAbstract']),
  value: z.string(),
});

const OverrideMultiLocationSpecifierSchema = z.object({
  type: z.literal('Override'),
  value: MultiLocationSchema,
});

const MultiLocationValueSchema = z.union([
  z.string(),
  MultiLocationSchema,
  z.array(JunctionSchema),
]);

const MultiLocationValueWithOverrideSchema = z.union([
  MultiLocationValueSchema,
  OverrideMultiLocationSpecifierSchema,
]);

const CurrencySymbolValueSchema = z.union([z.string(), SymbolSpecifierSchema]);

const CurrencySymbolSchema = z.object({
  symbol: CurrencySymbolValueSchema,
});

export const CurrencyCoreSchemaV1 = z.union([
  z
    .object({
      symbol: z.string(),
    })
    .required(),
  z
    .object({
      id: z.union([z.string(), z.number(), z.bigint()]),
    })
    .required(),
]);

export const CurrencyCoreSchema = z.union([
  CurrencySymbolSchema,
  z.object({
    id: z.union([z.string(), z.number(), z.bigint()]),
  }),
  z.object({
    multilocation: MultiLocationValueSchema,
  }),
]);

export const CurrencyCoreWithAmountSchema = CurrencyCoreSchema.and(
  z.object({
    amount: AmountSchema,
  }),
);

const CurrencyCoreWithFeeSchema = CurrencyCoreWithAmountSchema.and(
  z.object({
    isFeeAsset: z.boolean().optional(),
  }),
);

const CurrencyCoreWithMLOverride = z
  .union([
    CurrencySymbolSchema,
    z.object({
      id: z.union([z.string(), z.number(), z.bigint()]),
    }),
    z.object({
      multilocation: MultiLocationValueWithOverrideSchema,
    }),
  ])
  .and(
    z.object({
      amount: AmountSchema,
    }),
  );

export const CurrencySchema = z.union([
  CurrencyCoreWithMLOverride,
  z.object({
    multiasset: z.union([
      z.array(MultiAssetWithFeeSchema),
      z.array(CurrencyCoreWithFeeSchema),
    ]),
  }),
]);

const versionValues = Object.values(Version) as [Version, ...Version[]];

export const XTransferDtoSchema = z.object({
  from: z.string(),
  to: z.union([z.string(), MultiLocationSchema]),
  address: z.union([
    z.string().min(1, { message: 'Address is required' }),
    MultiLocationSchema,
  ]),
  ahAddress: z.string().optional(),
  currency: CurrencySchema,
  xcmVersion: z.enum(versionValues).optional(),
});

export type XTransferDto = z.infer<typeof XTransferDtoSchema>;
