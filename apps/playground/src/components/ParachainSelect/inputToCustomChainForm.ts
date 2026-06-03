import type { TCustomChainInput } from '@paraspell/sdk';
import { formatUnits } from '@paraspell/sdk';

import type {
  TCustomChainAssetEntry,
  TCustomChainFormValues,
} from '../../types/TCustomChain';

export const inputToCustomChainForm = (
  name: string,
  input: TCustomChainInput,
): TCustomChainFormValues => {
  const providers =
    input.providers.length > 0
      ? input.providers.map((p) => ({ name: p.name, endpoint: p.endpoint }))
      : [{ name: '', endpoint: '' }];

  const assets: TCustomChainAssetEntry[] = (input.assets ?? []).map(
    (asset) => ({
      symbol: asset.symbol,
      decimals: asset.decimals,
      assetId: asset.assetId ?? '',
      location: JSON.stringify(asset.location, null, 2),
      existentialDeposit: asset.existentialDeposit
        ? formatUnits(BigInt(asset.existentialDeposit), asset.decimals)
        : '',
      isNative: asset.isNative ?? false,
    }),
  );

  return {
    name,
    paraId: input.paraId,
    ecosystem: input.ecosystem,
    xcmVersion: input.xcmVersion,
    ss58Prefix: input.ss58Prefix ?? '',
    providers,
    assets,
    pallets: {
      nativeAssets: input.pallets?.nativeAssets ?? '',
      otherAssets: input.pallets?.otherAssets ?? [],
    },
  };
};
