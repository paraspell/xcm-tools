import {
  findAssetInfo,
  getAssetDecimals,
  type TAssetInfo,
  type TChain,
  type TCurrencyInput,
  type TSubstrateChain,
} from '@paraspell/sdk';

const toNumber = (value?: number | string | null) =>
  value == null ? null : Number(value);

const toCurrencyInput = (asset: TAssetInfo): TCurrencyInput | null => {
  if ('symbol' in asset && asset.symbol) {
    return { symbol: asset.symbol };
  }

  if ('assetId' in asset && asset.assetId != null) {
    return { id: asset.assetId };
  }

  if ('location' in asset && asset.location != null) {
    return { location: asset.location };
  }

  return null;
};

const findDecimals = (
  chain: TSubstrateChain | TChain,
  asset: TAssetInfo,
): number | null => {
  const currencyInput = toCurrencyInput(asset);
  if (!currencyInput) return null;

  const resolvedAsset = findAssetInfo(chain, currencyInput, null);
  return toNumber(resolvedAsset?.decimals);
};

export function resolveDecimals(
  chain: TSubstrateChain | TChain,
  asset: TAssetInfo,
): number | null {
  const explicit = toNumber(asset.decimals);
  if (explicit != null) return explicit;

  const resolved = findDecimals(chain, asset);
  if (resolved != null) return resolved;

  if (asset.symbol) {
    const fallback = getAssetDecimals(chain, asset.symbol);
    if (typeof fallback === 'number') return fallback;
  }

  return null;
}
