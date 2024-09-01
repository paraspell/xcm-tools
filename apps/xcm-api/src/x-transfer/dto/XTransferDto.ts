import { z } from 'zod';
import { Version } from '@paraspell/sdk';
import { MultiLocationSchema } from '@paraspell/xcm-analyser';

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
