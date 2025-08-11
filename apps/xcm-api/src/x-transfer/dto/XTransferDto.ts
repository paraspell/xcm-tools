import { Version } from '@paraspell/sdk';
import { MultiLocationSchema } from '@paraspell/xcm-analyser';
import { z } from 'zod';

import { validateAmount } from '../../utils/validateAmount.js';

const StringOrNumber = z
  .union([
    z
      .string()
      .regex(/^(?:\d{1,3}(?:,\d{3})*|\d+)$/)
      .transform((s) => s.replace(/,/g, '')),
    z.number(),
    z.bigint(),
  ])
  .transform((value) => BigInt(value));

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

export const BuilderOptionsSchema = z
  .object({
    apiOverrides: z
      .record(z.string(), z.union([z.string(), z.array(z.string())]))
      .optional(),
    development: z.boolean().optional(),
  })
  .strict();

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

const MultiLocationValueSchema = z.union([z.string(), MultiLocationSchema]);

const MultiLocationValueWithOverrideSchema = z.union([
  MultiLocationValueSchema,
  OverrideMultiLocationSpecifierSchema,
]);

const CurrencySymbolValueSchema = z.union([z.string(), SymbolSpecifierSchema]);

const CurrencySymbolSchema = z.object({
  symbol: CurrencySymbolValueSchema,
});

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
      z.array(MultiAssetSchema),
      z.array(CurrencyCoreWithAmountSchema),
    ]),
  }),
]);

const versionValues = Object.values(Version) as [Version, ...Version[]];

export const XTransferDtoSchema = z
  .object({
    from: z.string(),
    to: z.union([z.string(), MultiLocationSchema]),
    address: z.union([
      z.string().min(1, { message: 'Address is required' }),
      MultiLocationSchema,
    ]),
    currency: CurrencySchema,
    feeAsset: CurrencyCoreSchema.optional(),
    xcmVersion: z.enum(versionValues).optional(),
    pallet: z.string().optional(),
    method: z.string().optional(),
    senderAddress: z.string().optional(),
    ahAddress: z.string().optional(),
    options: BuilderOptionsSchema.optional(),
  })
  .strict();

export const XTransferDtoWSenderAddressSchema = XTransferDtoSchema.extend({
  senderAddress: z.string().min(1, { message: 'Sender address is required' }),
});

export const GetXcmFeeSchema = XTransferDtoWSenderAddressSchema.extend({
  disableFallback: z.boolean().default(false).optional(),
});

export type XTransferDto = z.infer<typeof XTransferDtoSchema>;
export type XTransferDtoWSenderAddress = z.infer<
  typeof XTransferDtoWSenderAddressSchema
>;
export type GetXcmFeeDto = z.infer<typeof GetXcmFeeSchema>;
