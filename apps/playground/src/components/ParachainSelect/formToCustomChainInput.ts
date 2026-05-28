import type {
  TCustomAssetInfo,
  TCustomChainInput,
  TLocation,
} from '@paraspell/sdk';

import type { TCustomChainFormValues } from '../../types/TCustomChain';

export const formToCustomChainInput = (
  values: TCustomChainFormValues,
): TCustomChainInput => {
  const providers = values.providers
    .filter((p) => p.name.trim() && p.endpoint.trim())
    .map((p) => ({ name: p.name.trim(), endpoint: p.endpoint.trim() }));

  const assets: TCustomAssetInfo[] = values.assets
    .filter((a) => a.symbol.trim() && a.decimals !== '')
    .map((a) => ({
      symbol: a.symbol.trim(),
      decimals: Number(a.decimals),
      location: JSON.parse(a.location.trim()) as TLocation,
      ...(a.assetId.trim() && { assetId: a.assetId.trim() }),
      ...(a.isNative && { isNative: true }),
    }));

  const hasPallets =
    values.pallets.nativeAssets || values.pallets.otherAssets.length > 0;

  return {
    paraId: Number(values.paraId),
    ecosystem: values.ecosystem,
    providers,
    xcmVersion: values.xcmVersion,
    ...(values.ss58Prefix !== '' && { ss58Prefix: Number(values.ss58Prefix) }),
    ...(assets.length > 0 && { assets }),
    ...(hasPallets && {
      pallets: {
        ...(values.pallets.nativeAssets && {
          nativeAssets: values.pallets.nativeAssets,
        }),
        ...(values.pallets.otherAssets.length > 0 && {
          otherAssets: values.pallets.otherAssets,
        }),
      },
    }),
  };
};
