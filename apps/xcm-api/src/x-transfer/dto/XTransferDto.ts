import { z } from 'zod';
import { TAddress, TCurrencyInput, Version } from '@paraspell/sdk';
import { MultiLocationSchema } from '@paraspell/xcm-analyser';
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

export const CurrencyCoreSchema = z.union([
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

export const CurrencySchema = z.union([
  z.object({
    symbol: z.string(),
  }),
  z.object({
    id: z.union([z.string(), z.number(), z.bigint()]),
  }),
  z.object({
    multilocation: MultiLocationSchema,
  }),
  z.object({
    multiasset: z.array(MultiAssetSchema),
  }),
]);

const versionValues = Object.values(Version) as [Version, ...Version[]];

export const XTransferDtoSchema = z.object({
  from: z.string().optional(),
  to: z.union([z.string().optional(), MultiLocationSchema]),
  amount: z.union([
    z.string().refine(validateAmount, {
      message: 'Amount must be a positive number',
    }),
    z.number().positive({ message: 'Amount must be a positive number' }),
  ]),
  address: z.union([
    z.string().min(1, { message: 'Address is required' }),
    MultiLocationSchema,
  ]),
  currency: CurrencySchema.optional(),
  xcmVersion: z.enum(versionValues).optional(),
});

export type XTransferDto = z.infer<typeof XTransferDtoSchema>;

export type PatchedXTransferDto = XTransferDto & {
  currency: TCurrencyInput;
  address: TAddress;
};
