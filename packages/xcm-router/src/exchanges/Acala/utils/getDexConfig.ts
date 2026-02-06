import { Wallet } from '@acala-network/sdk';
import { FixedPointNumber } from '@acala-network/sdk-core';
import { AcalaDex, AggregateDex } from '@acala-network/sdk-swap';
import type { TParachain } from '@paraspell/sdk';
import {
  findAssetInfoById,
  getNativeAssets,
  getOtherAssets,
  RoutingResolutionError,
} from '@paraspell/sdk';
import type { ApiPromise } from '@polkadot/api';
import { firstValueFrom } from 'rxjs';

import type { TDexConfig, TPairs, TRouterAsset } from '../../../types';

export const getDexConfig = async (api: ApiPromise, chain: TParachain): Promise<TDexConfig> => {
  const wallet = new Wallet(api);
  await wallet.isReady;

  const pools = Object.values(await wallet.liquidity.getAllEnabledPoolDetails());
  const assetsMap = new Map<string, TRouterAsset>();

  pools.forEach((pool) => {
    pool.info.pair.forEach((currency) => {
      const symbol = currency.symbol;
      if (assetsMap.has(symbol)) return;

      const idObj = JSON.parse(currency.toCurrencyId(api).toString()) as Record<string, unknown>;
      const [key] = Object.keys(idObj);
      const idVal = idObj[key] as string | Record<string, unknown>;
      if (Array.isArray(idVal)) return;

      let routerAsset: TRouterAsset | undefined;

      if (key.toLowerCase() === 'token') {
        const sdkAsset = getNativeAssets(chain).find((a) => a.symbol === symbol);
        if (!sdkAsset) throw new RoutingResolutionError(`Native asset not found: ${symbol}`);
        routerAsset = { symbol, location: sdkAsset.location, decimals: sdkAsset.decimals };
      } else {
        const formatted = typeof idVal === 'object' ? JSON.stringify(idVal) : idVal.toString();
        if (key.toLowerCase() !== 'erc20') {
          const sdkAsset = findAssetInfoById(getOtherAssets(chain), formatted);
          if (!sdkAsset) throw new RoutingResolutionError(`Asset not found: ${formatted}`);
          routerAsset = {
            symbol,
            decimals: sdkAsset.decimals,
            assetId: sdkAsset.assetId,
            location: sdkAsset.location,
          };
        }
      }
      if (routerAsset) assetsMap.set(symbol, routerAsset);
    });
  });

  const assets = Array.from(assetsMap.values());

  const seen = new Set<string>();
  const directPairs: TPairs = [];

  pools.forEach((pool) => {
    const [tA, tB] = pool.info.pair;
    const a = assetsMap.get(tA.symbol);
    const b = assetsMap.get(tB.symbol);
    if (!a || !b) return;

    const key = [tA.symbol, tB.symbol].sort().join('-');
    if (seen.has(key)) return;
    seen.add(key);
    directPairs.push([a.location, b.location]);
  });

  const acalaDex = new AcalaDex({ api, wallet });
  const dex = new AggregateDex({ api, wallet, providers: [acalaDex] });

  const syntheticPairs: TPairs = [];

  for (let i = 0; i < assets.length; i++) {
    for (let j = i + 1; j < assets.length; j++) {
      const A = assets[i];
      const B = assets[j];

      const key = [A.symbol, B.symbol].sort().join('-');
      if (seen.has(key)) continue;

      try {
        const tokA = wallet.getToken(A.symbol);
        const tokB = wallet.getToken(B.symbol);
        const amount = new FixedPointNumber('1', tokA.decimals);

        await firstValueFrom(
          dex.swap({
            path: [tokA, tokB],
            mode: 'EXACT_INPUT',
            source: 'aggregate',
            input: amount,
          }),
        );

        syntheticPairs.push([A.location, B.location]);
        seen.add(key);
      } catch {
        /* no path - ignore */
      }
    }
  }

  return {
    isOmni: false,
    assets,
    pairs: [...directPairs, ...syntheticPairs],
  };
};
