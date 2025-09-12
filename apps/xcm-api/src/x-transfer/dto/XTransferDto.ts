import { Version } from '@paraspell/sdk';
import { LocationSchema } from '@paraspell/xcm-analyser';
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

export const AssetSchemaV3 = z.object({
  id: z.object({
    Concrete: LocationSchema,
  }),
  fun: z.object({
    Fungible: StringOrNumber,
  }),
});

export const AssetSchemaV4 = z.object({
  id: LocationSchema,
  fun: z.object({
    Fungible: StringOrNumber,
  }),
});

export const AssetSchema = z.union([AssetSchemaV3, AssetSchemaV4]);

export type TAsset = z.infer<typeof AssetSchema>;

export const BuilderOptionsSchema = z
  .object({
    apiOverrides: z
      .record(z.string(), z.union([z.string(), z.array(z.string())]))
      .optional(),
    development: z.boolean().optional(),
    abstractDecimals: z.boolean().optional(),
    xcmFormatCheck: z.boolean().optional(),
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

const OverrideLocationSpecifierSchema = z.object({
  type: z.literal('Override'),
  value: LocationSchema,
});

const LocationValueSchema = z.union([z.string(), LocationSchema]);

const LocationValueWithOverrideSchema = z.union([
  LocationValueSchema,
  OverrideLocationSpecifierSchema,
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
    location: LocationValueSchema,
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
      location: LocationValueWithOverrideSchema,
    }),
  ])
  .and(
    z.object({
      amount: AmountSchema,
    }),
  );

export const CurrencySchema = z.union([
  CurrencyCoreWithMLOverride,
  z.array(AssetSchema),
  z.array(CurrencyCoreWithAmountSchema),
]);

const versionValues = Object.values(Version) as [Version, ...Version[]];

export const XTransferDtoSchema = z
  .object({
    from: z.string(),
    to: z.union([z.string(), LocationSchema]),
    address: z.union([
      z.string().min(1, { message: 'Address is required' }),
      LocationSchema,
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

export const DryRunPreviewSchema = XTransferDtoWSenderAddressSchema.omit({
  options: true,
}).extend({
  options: BuilderOptionsSchema.extend({
    mintFeeAssets: z.boolean().optional(),
  }).optional(),
});

export type XTransferDto = z.infer<typeof XTransferDtoSchema>;
export type XTransferDtoWSenderAddress = z.infer<
  typeof XTransferDtoWSenderAddressSchema
>;
export type DryRunPreviewDto = z.infer<typeof DryRunPreviewSchema>;
export type GetXcmFeeDto = z.infer<typeof GetXcmFeeSchema>;
