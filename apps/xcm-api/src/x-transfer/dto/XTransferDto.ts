import { EVM_ORIGIN_CHAINS } from '@paraspell/evm';
import {
  ASSETS_PALLETS,
  CHAINS,
  EXCHANGE_CHAINS,
  RELAYCHAINS,
  TRANSACT_ORIGINS,
  Version,
} from '@paraspell/sdk';
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

const ProviderEntrySchema = z.object({
  name: z.string().min(1),
  endpoint: z.string().min(1),
});

export const CustomAssetInfoSchema = z.object({
  symbol: z.string().min(1),
  decimals: z.number().int().nonnegative(),
  location: LocationSchema,
  assetId: z.string().optional(),
  existentialDeposit: z.string().optional(),
  isFeeAsset: z.boolean().optional(),
  isNative: z.boolean().optional(),
  alias: z.string().optional(),
  forceOverride: z.boolean().optional(),
});

export const CustomChainPalletsInputSchema = z.object({
  nativeAssets: z.enum(ASSETS_PALLETS).optional(),
  otherAssets: z.array(z.enum(ASSETS_PALLETS)).optional(),
});

export const CustomChainInputSchema = z.object({
  paraId: z.number().int().nonnegative(),
  ecosystem: z.enum(RELAYCHAINS),
  providers: z.array(ProviderEntrySchema).min(1),
  xcmVersion: z.nativeEnum(Version),
  ss58Prefix: z.number().int().nonnegative().optional(),
  nativeAssetSymbol: z.string().optional(),
  nativeAssetDecimals: z.number().int().nonnegative().optional(),
  assets: z.array(CustomAssetInfoSchema).optional(),
  pallets: CustomChainPalletsInputSchema.optional(),
});

export const CustomAssetsMapSchema = z.partialRecord(
  z.enum(CHAINS),
  z.array(CustomAssetInfoSchema),
);

export const CustomChainsMapSchema = z.record(
  z.string().min(1),
  CustomChainInputSchema,
);

export const BuilderOptionsSchema = z
  .object({
    apiOverrides: z
      .record(z.string(), z.union([z.string(), z.array(z.string())]))
      .optional(),
    development: z.boolean().optional(),
    abstractDecimals: z.boolean().optional(),
    xcmFormatCheck: z.boolean().optional(),
    customAssets: CustomAssetsMapSchema.optional(),
    customChains: CustomChainsMapSchema.optional(),
  })
  .strip();

const WeightSchema = z.object({
  refTime: StringOrNumber,
  proofSize: StringOrNumber,
});

export const TransactOptionsSchema = z.object({
  call: z.string(),
  originKind: z.enum(TRANSACT_ORIGINS).optional(),
  maxWeight: WeightSchema.optional(),
});

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

export const ExchangeSchema = z
  .union([z.enum(EXCHANGE_CHAINS), z.array(z.enum(EXCHANGE_CHAINS))])
  .optional();

export const SwapOptionsSchema = z.object({
  currencyTo: CurrencyCoreSchema,
  exchange: ExchangeSchema,
  slippage: z.number().or(z.string()).optional(),
  evmSenderAddress: z.string().min(1).optional(),
});

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
    from: z.string().min(1),
    to: z.union([z.string().min(1), LocationSchema]),
    recipient: z.union([z.string(), LocationSchema]),
    currency: CurrencySchema,
    feeAsset: CurrencyCoreSchema.optional(),
    xcmVersion: z.enum(versionValues).optional().nullable(),
    keepAlive: z.boolean().optional(),
    pallet: z.string().optional(),
    method: z.string().optional(),
    sender: z.string().optional(),
    ahAddress: z.string().optional(),
    transactOptions: TransactOptionsSchema.optional(),
    swapOptions: SwapOptionsSchema.optional(),
    options: BuilderOptionsSchema.optional(),
  })
  .strip();

export const XTransferDtoWSenderSchema = XTransferDtoSchema.extend({
  sender: z.string().min(1, { message: 'Sender is required' }),
});

export const GetXcmFeeSchema = XTransferDtoWSenderSchema.extend({
  disableFallback: z.boolean().default(false).optional(),
});

export const DryRunPreviewSchema = XTransferDtoWSenderSchema.omit({
  options: true,
}).extend({
  options: BuilderOptionsSchema.extend({
    mintFeeAssets: z.boolean().optional(),
  }).optional(),
});

export const SignAndSubmitSchema = XTransferDtoSchema.extend({
  sender: z.string().startsWith('//', {
    message: 'Sender must be a derivation path (e.g., //Alice)',
  }),
});

export const EvmXTransferDtoSchema = XTransferDtoWSenderSchema.extend({
  from: z.enum(['Ethereum', ...EVM_ORIGIN_CHAINS]),
});

export const EvmApproveDtoSchema = z
  .object({
    symbol: z.string().min(1, { message: 'Symbol is required' }),
    amount: AmountSchema,
  })
  .strip();

export const ExchangePairsSchema = z.object({
  exchange: ExchangeSchema,
});

export const SupportedAssetsFromSchema = z.object({
  from: z.enum(CHAINS).optional(),
  exchange: ExchangeSchema,
});

export const SupportedAssetsToSchema = z.object({
  exchange: ExchangeSchema,
  to: z.enum(CHAINS).optional(),
});

export type SwapOptions = z.infer<typeof SwapOptionsSchema>;
export type XTransferDto = z.infer<typeof XTransferDtoSchema>;
export type XTransferDtoWSender = z.infer<typeof XTransferDtoWSenderSchema>;
export type EvmXTransferDto = z.infer<typeof EvmXTransferDtoSchema>;
export type EvmApproveDto = z.infer<typeof EvmApproveDtoSchema>;
export type DryRunPreviewDto = z.infer<typeof DryRunPreviewSchema>;
export type GetXcmFeeDto = z.infer<typeof GetXcmFeeSchema>;
export type SignAndSubmitDto = z.infer<typeof SignAndSubmitSchema>;
export type ExchangePairsDto = z.infer<typeof ExchangePairsSchema>;
export type SupportedAssetsFromDto = z.infer<typeof SupportedAssetsFromSchema>;
export type SupportedAssetsToDto = z.infer<typeof SupportedAssetsToSchema>;
