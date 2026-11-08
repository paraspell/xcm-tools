import {
  ASSETS_PALLETS,
  RELAYCHAINS,
  type TCustomAssetsMap,
  Version,
} from '@paraspell/sdk';
import { LocationSchema } from '@paraspell/xcm-analyser';
import z from 'zod';

import type { TStoredCustomChains } from '../types/TCustomChain';

const CONFIG_VERSION = 1;

export const ProviderEntrySchema = z.object({
  name: z.string().min(1),
  endpoint: z.string().min(1),
});

export const Erc20InfoSchema = z.object({
  balanceSlot: z.number().int().nonnegative(),
  contract: z.string().optional(),
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
  erc20: Erc20InfoSchema.optional(),
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

export const ChainAssetsInfoSchema = z.object({
  relaychainSymbol: z.string().min(1),
  nativeAssetSymbol: z.string().min(1),
  isEVM: z.boolean(),
  ss58Prefix: z.number().int().nonnegative(),
  supportsDryRunApi: z.boolean(),
  supportsXcmPaymentApi: z.boolean(),
  assets: z.array(CustomAssetInfoSchema),
});

export const StoredCustomChainSchema = z.object({
  input: CustomChainInputSchema,
  assetsInfo: ChainAssetsInfoSchema,
});

export const CustomChainsMapSchema = z.record(
  z.string().min(1),
  StoredCustomChainSchema,
);

export const CustomAssetsMapSchema = z.record(
  z.string().min(1),
  z.array(CustomAssetInfoSchema),
);

export type TCustomConfigFile = {
  version: number;
  customChains: TStoredCustomChains;
  customAssets: TCustomAssetsMap;
};

export const buildCustomConfig = (
  customChains: TStoredCustomChains,
  customAssets: TCustomAssetsMap,
): TCustomConfigFile => ({
  version: CONFIG_VERSION,
  customChains,
  customAssets,
});

export const downloadCustomConfig = (config: TCustomConfigFile) => {
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'paraspell-custom-config.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseCustomConfig = (text: string): TCustomConfigFile => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }

  if (!isRecord(parsed)) {
    throw new Error('Config must be a JSON object.');
  }

  const { customChains, customAssets } = parsed;

  if (customChains !== undefined && !isRecord(customChains)) {
    throw new Error('"customChains" must be an object.');
  }

  if (customAssets !== undefined && !isRecord(customAssets)) {
    throw new Error('"customAssets" must be an object.');
  }

  if (customChains === undefined && customAssets === undefined) {
    throw new Error(
      'Config must contain "customChains" and/or "customAssets".',
    );
  }

  let validatedCustomChains: TStoredCustomChains = {};
  if (customChains !== undefined) {
    const result = CustomChainsMapSchema.safeParse(customChains);
    if (!result.success) {
      const issue = result.error.issues[0];
      const path = issue.path.length > 0 ? ` at "${issue.path.join('.')}"` : '';
      throw new Error(`Invalid "customChains"${path}: ${issue.message}`);
    }
    validatedCustomChains = result.data as TStoredCustomChains;
  }

  let validatedCustomAssets: TCustomAssetsMap = {};
  if (customAssets !== undefined) {
    const result = CustomAssetsMapSchema.safeParse(customAssets);
    if (!result.success) {
      const issue = result.error.issues[0];
      const path = issue.path.length > 0 ? ` at "${issue.path.join('.')}"` : '';
      throw new Error(`Invalid "customAssets"${path}: ${issue.message}`);
    }
    validatedCustomAssets = result.data;
  }

  return {
    version:
      typeof parsed.version === 'number' ? parsed.version : CONFIG_VERSION,
    customChains: validatedCustomChains,
    customAssets: validatedCustomAssets,
  };
};
