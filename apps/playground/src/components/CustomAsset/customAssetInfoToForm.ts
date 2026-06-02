import type { TCustomAssetInfo } from '@paraspell/sdk';

import type { TCustomAssetFormValues } from '../../types/TCustomAsset';

export const customAssetInfoToForm = (
  asset: TCustomAssetInfo,
): TCustomAssetFormValues => ({
  symbol: asset.symbol,
  decimals: asset.decimals,
  assetId: asset.assetId ?? '',
  location: JSON.stringify(asset.location, null, 2),
  isNative: asset.isNative ?? false,
  forceOverride: asset.forceOverride ?? false,
  overrideAssetKey: '',
});
