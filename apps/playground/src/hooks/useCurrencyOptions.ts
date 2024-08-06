import {
  getSupportedAssets,
  TAsset,
  TNodeWithRelayChains,
} from "@paraspell/sdk";
import { useMemo } from "react";

const useCurrencyOptions = (
  from: TNodeWithRelayChains,
  to: TNodeWithRelayChains
) => {
  const isNotParaToPara =
    from === "Polkadot" ||
    from === "Kusama" ||
    to === "Polkadot" ||
    to === "Kusama";

  const supportedAssets = useMemo(
    () => getSupportedAssets(from, to),
    [from, to]
  );

  const currencyMap = useMemo(
    () =>
      supportedAssets.reduce((map: Record<string, TAsset>, asset) => {
        const key = `${asset.symbol ?? "NO_SYMBOL"}-${asset.assetId ?? "NO_ID"}`;
        map[key] = asset;
        return map;
      }, {}),
    [supportedAssets]
  );

  const currencyOptions = useMemo(
    () =>
      Object.keys(currencyMap).map((key) => ({
        value: key,
        label: `${currencyMap[key].symbol} - ${currencyMap[key].assetId ?? "Native"}`,
      })),
    [currencyMap]
  );

  return { currencyOptions, isNotParaToPara, currencyMap };
};

export default useCurrencyOptions;
