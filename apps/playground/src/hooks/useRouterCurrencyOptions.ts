import type { TAsset, TNodeWithRelayChains } from "@paraspell/sdk";
import { useMemo } from "react";
import type { TAutoSelect, TExchangeNode } from "@paraspell/xcm-router";
import {
  getSupportedAssetsFrom,
  getSupportedAssetsTo,
} from "@paraspell/xcm-router";

const useRouterCurrencyOptions = (
  from: TNodeWithRelayChains,
  exchangeNode: TExchangeNode | TAutoSelect,
  to: TNodeWithRelayChains,
) => {
  const supportedAssetsFrom = useMemo(
    () => getSupportedAssetsFrom(from, exchangeNode),
    [from, exchangeNode],
  );

  const supportedAssetsTo = useMemo(
    () => getSupportedAssetsTo(from, exchangeNode, to),
    [exchangeNode, to],
  );

  const currencyFromMap = useMemo(
    () =>
      supportedAssetsFrom.reduce((map: Record<string, TAsset>, asset) => {
        const key = `${asset.symbol ?? "NO_SYMBOL"}-${asset.assetId ?? "NO_ID"}`;
        map[key] = asset;
        return map;
      }, {}),
    [supportedAssetsFrom],
  );

  const currencyToMap = useMemo(
    () =>
      supportedAssetsTo.reduce((map: Record<string, TAsset>, asset) => {
        const key = `${asset.symbol ?? "NO_SYMBOL"}-${asset.assetId ?? "NO_ID"}`;
        map[key] = asset;
        return map;
      }, {}),
    [supportedAssetsTo],
  );

  const currencyFromOptions = useMemo(
    () =>
      Object.keys(currencyFromMap).map((key) => ({
        value: key,
        label: `${currencyFromMap[key].symbol} - ${currencyFromMap[key].assetId ?? "Native"}`,
      })),
    [currencyFromMap],
  );

  const currencyToOptions = useMemo(
    () =>
      Object.keys(currencyToMap).map((key) => ({
        value: key,
        label: `${currencyToMap[key].symbol} - ${currencyToMap[key].assetId ?? "Native"}`,
      })),
    [currencyToMap],
  );

  const isFromNotParaToPara = from === "Polkadot" || from === "Kusama";
  const isToNotParaToPara = to === "Polkadot" || to === "Kusama";

  return {
    currencyFromOptions,
    currencyToOptions,
    currencyFromMap,
    currencyToMap,
    isFromNotParaToPara,
    isToNotParaToPara,
  };
};

export default useRouterCurrencyOptions;
