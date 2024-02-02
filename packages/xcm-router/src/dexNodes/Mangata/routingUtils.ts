/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

/*
Code partially inspired by https://app.mangata.finance/
*/

import {
  type PoolWithRatio as SdkPoolWithRatio,
  BN_ZERO,
  Mangata,
  fromBN,
  BN_THOUSAND,
  type TokenInfo,
  type Token,
  type MangataInstance,
} from '@mangata-finance/sdk';
import { type StorageKey } from '@polkadot/types';
import { type Codec } from '@polkadot/types/types/codec';
import { BN } from '@polkadot/util';
import axios from 'axios';
import { keyBy, pick } from 'lodash-es';

export const BN_AFTER_COMMISION: BN = new BN(997); // commission 0.3% per swap

export enum AssetType {
  Native,
  LP,
}

export interface Asset extends Pick<Token, 'id' | 'name' | 'symbol'> {
  decimals: number;
  type: AssetType;
}

export enum RouteDataError {
  InsufficientLiquidity = 'InsufficientLiquidity',
  InsufficientInputAmount = 'InsufficientInputAmount',
  NoPools = 'NoPools',
}

export type SwapRoute = TokenInfo[];

export interface RouteData {
  bestAmount: BN | null;
  bestRoute: SwapRoute | null;
  priceImpact?: number;
  error?: RouteDataError;
}

const MAX_HOPS_LIMIT = 6;
const NO_ROUTE_DATA = { bestRoute: null, bestAmount: null };

export type PoolKey = string;

interface WithPoolMetadata {
  firstAsset: TokenInfo;
  secondAsset: TokenInfo;
  id: string;
  symbols: [string, string];
}

export type PoolWithRatio = SdkPoolWithRatio & WithPoolMetadata;

export interface AllPoolsQueryData {
  byId: Record<PoolKey, PoolWithRatio>;
  list: PoolWithRatio[];
  byAdjacentId: Record<PoolKey, PoolWithRatio[]>;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getOutputAmount = (inputReserve: BN, outputReserve: BN, amount: BN) => {
  const numerator: BN = outputReserve.mul(amount).mul(BN_AFTER_COMMISION);
  const denominator: BN = inputReserve.mul(BN_THOUSAND).add(amount.mul(BN_AFTER_COMMISION));

  if (numerator.lte(BN_ZERO) || denominator.lte(BN_ZERO)) {
    return {
      value: BN_ZERO,
      isAmountSufficient: true,
    };
  }

  return {
    value: numerator.div(denominator),
    isAmountSufficient: numerator.gt(denominator),
  };
};

export const routeExactIn = (
  pools: AllPoolsQueryData | null,
  tokenIn: TokenInfo,
  tokenOut: TokenInfo,
  amountIn: BN,
  isAutoRoutingEnabled: boolean,
): RouteData => {
  const noPools = { ...NO_ROUTE_DATA, error: RouteDataError.NoPools };
  if (pools == null) {
    return noPools;
  }

  const explorePaths = (
    queue: SwapRoute[],
    visited: SwapRoute,
    result: RouteData | null,
  ): RouteData | null => {
    if (queue.length === 0) {
      return result;
    }

    const path = queue[0];
    const remainingQueue = queue.slice(1);
    const lastTokenInPath = path[path.length - 1];

    if (path.length > (isAutoRoutingEnabled ? MAX_HOPS_LIMIT : 2)) {
      return explorePaths(remainingQueue, visited, result);
    }

    if (lastTokenInPath.id === tokenOut.id) {
      let amountOut = amountIn;
      let priceImpact = 0;

      for (let i = 0; i < path.length - 1; i++) {
        const [tokenIn, tokenOut] = [path[i], path[i + 1]];
        const pool = pools.byId[`${tokenIn.id}-${tokenOut.id}`];

        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!pool) {
          return null;
        }

        const previousAmountOut = amountOut;
        const outPutResult = getOutputAmount(
          pool.firstTokenAmount,
          pool.secondTokenAmount,
          amountOut,
        );
        amountOut = outPutResult.value;

        if (amountOut.eq(BN_ZERO)) {
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          if (!result) {
            result = {
              ...NO_ROUTE_DATA,
              error: outPutResult.isAmountSufficient
                ? RouteDataError.InsufficientLiquidity
                : RouteDataError.InsufficientInputAmount,
            };
          }
        }

        const priceImpactStr = Mangata.getPriceImpact({
          poolReserves: [pool.firstTokenAmount, pool.secondTokenAmount],
          decimals: [pool.firstAsset.decimals, pool.secondAsset.decimals],
          tokenAmounts: [
            fromBN(previousAmountOut, pool.firstAsset.decimals),
            fromBN(amountOut, pool.secondAsset.decimals),
          ],
        });

        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (priceImpactStr) {
          priceImpact += parseFloat(priceImpactStr);
        }
      }

      if (!result || (result.bestAmount && amountOut.gt(result.bestAmount))) {
        result = { bestRoute: path, bestAmount: amountOut, priceImpact };
      }
    }

    const adjacentPools = pools.byAdjacentId?.[lastTokenInPath.id];

    if (!adjacentPools || Object.keys(adjacentPools).length === 0) {
      return explorePaths(remainingQueue, [...visited, lastTokenInPath], result);
    }

    const newPaths = adjacentPools
      .map((pool) => {
        const nextTokenId =
          pool.firstTokenId === lastTokenInPath.id ? pool.secondAsset : pool.firstAsset;
        if (!visited.includes(nextTokenId)) {
          return [...path, nextTokenId];
        }
        return null;
      })
      .filter(Boolean) as SwapRoute[];
    return explorePaths([...remainingQueue, ...newPaths], [...visited, lastTokenInPath], result);
  };

  const res = explorePaths([[tokenIn]], [tokenIn], null);

  if (res === null) {
    return noPools;
  }

  return res;
};

export interface TransformPoolsResult {
  byLPId: Record<PoolKey, PoolWithRatio>;
  baseList: PoolWithRatio[];
  list: PoolWithRatio[];
  byId: Record<string, PoolWithRatio>;
  byAdjacentId: Record<string, PoolWithRatio[]>;
}

const getInvertedPool = (pool: PoolWithRatio) => ({
  ...pool,
  secondAsset: pool.firstAsset,
  secondTokenAmount: pool.firstTokenAmount,
  secondTokenId: pool.firstTokenId,
  secondTokenRatio: pool.firstTokenRatio,
  firstAsset: pool.secondAsset,
  firstTokenAmount: pool.secondTokenAmount,
  firstTokenId: pool.secondTokenId,
  firstTokenRatio: pool.secondTokenRatio,
  id: `${pool.secondTokenId}-${pool.firstTokenId}`,
  symbols: [pool.secondAsset.symbol, pool.firstAsset.symbol],
});

export const transformToAsset = (asset: any): Asset => ({
  ...pick(asset, ['id', 'name', 'symbol']),
  decimals: parseInt(asset.decimals.toString()),
  type: !asset.symbol.includes('-') ? AssetType.Native : AssetType.LP,
});

export const transformAllPools =
  (assets: any[] | null | undefined, isFirstPoolTokenLeader: (pool: PoolWithRatio) => boolean) =>
  (pools: SdkPoolWithRatio[] | null): TransformPoolsResult | null => {
    if (!pools || !assets) {
      return null;
    }

    const basePools = pools
      .map((pool) => {
        const firstNativeAsset = assets.find((asset) => asset.id === pool.firstTokenId);
        const secondNativeAsset = assets.find((asset) => asset.id === pool.secondTokenId);

        if (firstNativeAsset && secondNativeAsset) {
          const serializedPool: PoolWithRatio = {
            ...pool,
            firstAsset: transformToAsset(firstNativeAsset),
            secondAsset: transformToAsset(secondNativeAsset),
            id: `${pool.firstTokenId}-${pool.secondTokenId}`,
            symbols: [firstNativeAsset.symbol, secondNativeAsset.symbol],
          };

          return isFirstPoolTokenLeader(serializedPool)
            ? getInvertedPool(serializedPool)
            : serializedPool;
        }

        return null;
      })
      .filter(Boolean) as PoolWithRatio[];

    const invertedPools = basePools.map(getInvertedPool);

    const poolsData = [...basePools, ...invertedPools].filter(Boolean) as PoolWithRatio[];
    const adjacentPools = poolsData.reduce((acc: Record<PoolKey, PoolWithRatio[]>, pool) => {
      return {
        ...acc,
        [pool.firstTokenId]: [...(acc[pool.firstTokenId] || []), pool],
        [pool.secondTokenId]: [...(acc[pool.secondTokenId] || []), pool],
      };
    }, {});

    return {
      baseList: basePools,
      list: poolsData,
      byId: keyBy(poolsData, 'id'),
      byLPId: keyBy(poolsData, 'liquidityTokenId'),
      byAdjacentId: adjacentPools,
    };
  };

export const transformAssetMetadata = (data: Array<[StorageKey, Codec]> | null): any[] | null => {
  if (data === null) {
    return null;
  }

  const tokens = data
    .map(([storageKey, codec]) => {
      const key = storageKey.toHuman();
      const id = Array.isArray(key) ? key[0]?.toString() : null;

      const metadata = codec.toHuman() as any;

      if (!id || !metadata) {
        return null;
      }

      return {
        id: id || storageKey.toString(),
        ...metadata,
      };
    })
    .filter(Boolean);

  return tokens.length === 0 ? null : tokens;
};

const getNativeTokens = async (mangata: MangataInstance) => {
  const apiInstance = await mangata.api();
  const assetsMetadata = await apiInstance.query.assetRegistry.metadata.entries();
  const assetsMetadataTransformed = transformAssetMetadata(assetsMetadata);

  if (assetsMetadataTransformed === null) {
    throw new Error('Assets metadata are null');
  }

  const nativeAssets = assetsMetadataTransformed.filter((a) => !a?.name.includes('Liquidity'));
  return nativeAssets;
};

export const getAllPools = async (mangata: MangataInstance) => {
  const { isFirstPoolTokenLeader } = await useTokenBucketQuery();
  const nativeTokens = await getNativeTokens(mangata);

  const pools = await mangata.query.getPools();

  const transformedPools = transformAllPools(nativeTokens, isFirstPoolTokenLeader)(pools);

  return transformedPools;
};

export const fetchTokenBuckets = async (): Promise<any[]> => {
  const { data } = await axios.get(
    `https://mangata-stash-prod-dot-direct-pixel-353917.oa.r.appspot.com/token/order-buckets`,
  );

  return data?.buckets;
};

export const getTokenRank =
  (bucketList: any[]): any =>
  (tokenSymbol: string | null | undefined) => {
    if (!tokenSymbol) {
      return { bucketRank: null, tokenRank: null };
    }
    const bucketRank = bucketList.findIndex((bucket) =>
      bucket.tokens.some((token: any) => token === tokenSymbol),
    );

    if (bucketRank === -1) {
      return { bucketRank: null, tokenRank: null };
    }

    const tokenRank = bucketList[bucketRank].tokens.findIndex(
      (token: any) => token === tokenSymbol,
    );

    if (tokenRank === -1) {
      return { bucketRank, tokenRank: null };
    }

    return { bucketRank, tokenRank };
  };

export const isFirstPoolTokenLeader =
  (bucketList: any[]): any =>
  (pool: PoolWithRatio) => {
    const getRank = getTokenRank(bucketList);

    const firstTokenRank = getRank(pool.firstAsset.symbol);
    const secondTokenRank = getRank(pool.secondAsset.symbol);

    if (firstTokenRank.bucketRank === null) {
      return false;
    }

    if (secondTokenRank.bucketRank === null) {
      return true;
    }

    if (firstTokenRank.bucketRank !== secondTokenRank.bucketRank) {
      return firstTokenRank.bucketRank < secondTokenRank.bucketRank;
    }

    return (
      (firstTokenRank.tokenRank && firstTokenRank.tokenRank < (secondTokenRank.tokenRank ?? 0)) ||
      !secondTokenRank.tokenRank
    );
  };

export const useTokenBucketQuery = async () => {
  const tokenBuckets = await fetchTokenBuckets();

  return {
    tokenBuckets,
    isFirstPoolTokenLeader: isFirstPoolTokenLeader(tokenBuckets),
  };
};
