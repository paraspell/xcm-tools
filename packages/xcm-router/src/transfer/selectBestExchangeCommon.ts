import { getAssetBySymbolOrId, hasSupportForAsset, type TNode } from '@paraspell/sdk-pjs';
import BigNumber from 'bignumber.js';

import { getExchangeAsset, getExchangeAssetByOriginAsset } from '../assets';
import { EXCHANGE_NODES } from '../consts';
import type ExchangeNode from '../dexNodes/DexNode';
import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';
import Logger from '../Logger/Logger';
import type { TGetBestAmountOutOptions, TRouterAsset } from '../types';
import { type TCommonTransferOptions } from '../types';

export const selectBestExchangeCommon = async <
  T extends TCommonTransferOptions | TGetBestAmountOutOptions,
>(
  options: T,
  computeAmountOut: (
    dex: ExchangeNode,
    assetFromExchange: TRouterAsset,
    assetTo: TRouterAsset,
    options: T,
  ) => Promise<BigNumber>,
): Promise<ExchangeNode> => {
  const { from, to, currencyFrom, currencyTo } = options;

  const assetFromOrigin = from ? getAssetBySymbolOrId(from, currencyFrom, null) : undefined;

  if (from && !assetFromOrigin) {
    throw new Error(
      `Currency from ${JSON.stringify(options.currencyFrom)} not found in ${options.from}.`,
    );
  }

  if ('id' in currencyTo) {
    throw new Error(
      'Cannot select currencyTo by ID when auto-selecting is enabled. Please specify currencyTo by symbol or MultiLocation.',
    );
  }

  Logger.log(
    `Selecting best exchange for asset pair ${assetFromOrigin?.symbol} -> ${JSON.stringify('symbol' in currencyTo ? currencyTo.symbol : '')}`,
  );

  let bestExchange: ExchangeNode | undefined;
  let maxAmountOut: BigNumber = new BigNumber(0);
  const errors = new Map<TNode, Error>();
  let triedAnyExchange = false;
  for (const exchangeNode of EXCHANGE_NODES) {
    const dex = createDexNodeInstance(exchangeNode);

    const originSpecified = from && from !== dex.node;
    const destinationSpecified = to && to !== dex.node;

    const assetFromExchange =
      originSpecified && assetFromOrigin
        ? getExchangeAssetByOriginAsset(dex.node, dex.exchangeNode, assetFromOrigin)
        : getExchangeAsset(dex.node, dex.exchangeNode, currencyFrom);

    if (!assetFromExchange) {
      continue;
    }

    const assetTo = getExchangeAsset(dex.node, dex.exchangeNode, currencyTo, true);

    if (!assetTo) {
      continue;
    }

    if (destinationSpecified && !hasSupportForAsset(to, assetTo.symbol)) {
      continue;
    }

    triedAnyExchange = true;

    Logger.log(`Checking ${exchangeNode}...`);

    try {
      const amountOut = await computeAmountOut(dex, assetFromExchange, assetTo, options);
      if (amountOut.gt(maxAmountOut)) {
        bestExchange = dex;
        maxAmountOut = amountOut;
      }
    } catch (e) {
      if (e instanceof Error) {
        errors.set(dex.node, e);
      }
      continue;
    }
  }
  if (bestExchange === undefined) {
    if (!triedAnyExchange && errors.size === 0) {
      throw new Error(
        `No exchange found that supports asset pair: ` +
          `${JSON.stringify(assetFromOrigin?.symbol)} -> ${JSON.stringify('symbol' in currencyTo ? currencyTo.symbol : '')}.`,
      );
    }

    throw new Error(
      `Could not select best exchange automatically. Please specify one manually. Errors: \n\n${Array.from(
        errors.entries(),
      )
        .map(([key, value]) => `${key}: ${value.message}`)
        .join('\n\n')}`,
    );
  }
  Logger.log(`Selected exchange: ${bestExchange.node}`);
  return bestExchange;
};
