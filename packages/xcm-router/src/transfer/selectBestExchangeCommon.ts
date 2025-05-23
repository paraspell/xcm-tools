import {
  determineRelayChain,
  findAsset,
  hasSupportForAsset,
  InvalidParameterError,
  type TNode,
} from '@paraspell/sdk';
import BigNumber from 'bignumber.js';
import type { PolkadotClient } from 'polkadot-api';

import { getExchangeAsset, getExchangeAssetByOriginAsset } from '../assets';
import { EXCHANGE_NODES } from '../consts';
import type ExchangeNode from '../dexNodes/DexNode';
import { createDexNodeInstance } from '../dexNodes/DexNodeFactory';
import Logger from '../Logger/Logger';
import type { TGetBestAmountOutOptions, TRouterAsset } from '../types';
import { type TCommonTransferOptions } from '../types';
import { canBuildToExchangeTx } from './canBuildToExchangeTx';

export const selectBestExchangeCommon = async <
  T extends TCommonTransferOptions | TGetBestAmountOutOptions,
>(
  options: T,
  originApi: PolkadotClient | undefined,
  computeAmountOut: (
    dex: ExchangeNode,
    assetFromExchange: TRouterAsset,
    assetTo: TRouterAsset,
    options: T,
  ) => Promise<BigNumber>,
): Promise<ExchangeNode> => {
  const { from, exchange, to, currencyFrom, currencyTo } = options;

  const assetFromOrigin = from ? findAsset(from, currencyFrom, null) : undefined;

  if (from && !assetFromOrigin) {
    throw new InvalidParameterError(
      `Currency from ${JSON.stringify(options.currencyFrom)} not found in ${options.from}.`,
    );
  }

  if ('id' in currencyTo) {
    throw new InvalidParameterError(
      'Cannot select currencyTo by ID when auto-selecting is enabled. Please specify currencyTo by symbol or multi-location.',
    );
  }

  Logger.log(
    `Selecting best exchange for asset pair ${assetFromOrigin?.symbol} -> ${JSON.stringify('symbol' in currencyTo ? currencyTo.symbol : '')}`,
  );

  const filteredExchangeNodes = Array.isArray(exchange) ? exchange : EXCHANGE_NODES;

  let bestExchange: ExchangeNode | undefined;
  let maxAmountOut: BigNumber = new BigNumber(0);
  const errors = new Map<TNode, Error>();
  let triedAnyExchange = false;
  for (const exchangeNode of filteredExchangeNodes) {
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

    if (from && determineRelayChain(from) !== determineRelayChain(dex.node)) {
      continue;
    }

    triedAnyExchange = true;

    Logger.log(`Checking ${exchangeNode}...`);

    const res = await canBuildToExchangeTx(options, dex.node, originApi, assetFromOrigin);
    if (!res.success) {
      errors.set(dex.node, res.error);
      continue;
    }

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
      throw new InvalidParameterError(
        `No exchange found that supports asset pair: ` +
          `${JSON.stringify(assetFromOrigin?.symbol)} -> ${JSON.stringify('symbol' in currencyTo ? currencyTo.symbol : '')}.`,
      );
    }

    throw new InvalidParameterError(
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
