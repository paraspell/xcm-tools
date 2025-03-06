import {
  isForeignAsset,
  type TAsset,
  type TNodeWithRelayChains,
} from '@paraspell/sdk';
import type {
  TAutoSelect,
  TExchangeNode,
  TRouterAsset,
} from '@paraspell/xcm-router';
import {
  getSupportedAssetsFrom,
  getSupportedAssetsTo,
} from '@paraspell/xcm-router';
import { useMemo } from 'react';

const useRouterCurrencyOptions = (
  from: TNodeWithRelayChains | undefined,
  exchangeNode: TExchangeNode | TAutoSelect,
  to: TNodeWithRelayChains | undefined,
) => {
  const supportedAssetsFrom = useMemo(
    () => getSupportedAssetsFrom(from, exchangeNode),
    [from, exchangeNode],
  );

  const supportedAssetsTo = useMemo(
    () => getSupportedAssetsTo(exchangeNode, to),
    [exchangeNode, to],
  );

  const currencyFromMap = useMemo(
    () =>
      supportedAssetsFrom.reduce((map: Record<string, TAsset>, asset) => {
        const key = `${asset.symbol ?? 'NO_SYMBOL'}-${isForeignAsset(asset) ? asset.assetId : 'NO_ID'}`;
        map[key] = asset;
        return map;
      }, {}),
    [supportedAssetsFrom],
  );

  const currencyToMap = useMemo(
    () =>
      supportedAssetsTo.reduce((map: Record<string, TRouterAsset>, asset) => {
        const key = `${asset.symbol ?? 'NO_SYMBOL'}-${asset.id ? asset.id : 'NO_ID'}`;
        map[key] = asset;
        return map;
      }, {}),
    [supportedAssetsTo],
  );

  const currencyFromOptions = useMemo(
    () =>
      Object.keys(currencyFromMap).map((key) => ({
        value: key,
        label: `${currencyFromMap[key].symbol} - ${isForeignAsset(currencyFromMap[key]) ? (currencyFromMap[key].assetId ?? 'Multi-location') : 'Native'}`,
      })),
    [currencyFromMap],
  );

  const currencyToOptions = useMemo(
    () =>
      Object.keys(currencyToMap).map((key) => ({
        value: key,
        label: `${currencyToMap[key].symbol} - ${currencyToMap[key].id ? (currencyToMap[key].id ?? 'Multi-location') : 'Native'}`,
      })),
    [currencyToMap],
  );

  const isFromNotParaToPara = from === 'Polkadot' || from === 'Kusama';
  const isToNotParaToPara = to === 'Polkadot' || to === 'Kusama';

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
