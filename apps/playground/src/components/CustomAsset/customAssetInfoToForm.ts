import type { TCustomAssetInfo } from '@paraspell/sdk';
import { formatUnits } from '@paraspell/sdk';

import type { TCustomAssetFormValues } from '../../types/TCustomAsset';

export const customAssetInfoToForm = (
  asset: TCustomAssetInfo,
): TCustomAssetFormValues => ({
  symbol: asset.symbol,
  decimals: asset.decimals,
  assetId: asset.assetId ?? '',
  location: JSON.stringify(asset.location, null, 2),
  existentialDeposit: asset.existentialDeposit
    ? formatUnits(BigInt(asset.existentialDeposit), asset.decimals)
    : '',
  isNative: asset.isNative ?? false,
  forceOverride: asset.forceOverride ?? false,
  overrideAssetKey: '',
});
