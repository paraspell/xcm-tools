import type { TCustomAssetInfo, TLocation } from '@paraspell/sdk';

import type { TCustomAssetFormValues } from '../../types/TCustomAsset';

export const formToCustomAssetInfo = (
  values: TCustomAssetFormValues,
): TCustomAssetInfo => ({
  symbol: values.symbol.trim(),
  decimals: Number(values.decimals),
  location: JSON.parse(values.location.trim()) as TLocation,
  ...(values.assetId.trim() && { assetId: values.assetId.trim() }),
  ...(values.isNative && { isNative: true }),
  ...(values.forceOverride && { forceOverride: true }),
});
