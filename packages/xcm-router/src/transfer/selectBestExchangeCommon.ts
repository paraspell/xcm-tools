import {
  applyDecimalAbstraction,
  findAssetInfo,
  getRelayChainOf,
  hasSupportForAsset,
  RoutingResolutionError,
  type TChain,
  UnsupportedOperationError,
} from '@paraspell/sdk';
import type { PolkadotClient } from 'polkadot-api';

import { getExchangeAsset, getExchangeAssetByOriginAsset } from '../assets';
import { EXCHANGE_CHAINS } from '../consts';
import type ExchangeChain from '../exchanges/ExchangeChain';
import { createExchangeInstance } from '../exchanges/ExchangeChainFactory';
import Logger from '../Logger/Logger';
import type {
  TCommonRouterOptions,
  TGetBestAmountOutOptions,
  TRouterAsset,
  TRouterBuilderOptions,
} from '../types';
import { canBuildToExchangeTx } from './canBuildToExchangeTx';

export const selectBestExchangeCommon = async <
  T extends TCommonRouterOptions | TGetBestAmountOutOptions,
>(
  options: T,
  originApi: PolkadotClient | undefined,
  computeAmountOut: (
    dex: ExchangeChain,
    assetFromExchange: TRouterAsset,
    assetTo: TRouterAsset,
    options: T,
  ) => Promise<bigint>,
  builderOptions?: TRouterBuilderOptions,
): Promise<ExchangeChain> => {
  const { from, exchange, to, currencyFrom, currencyTo } = options;

  const assetFromOrigin = from ? findAssetInfo(from, currencyFrom, null) : undefined;

  if (from && !assetFromOrigin) {
    throw new RoutingResolutionError(
      `Currency from ${JSON.stringify(options.currencyFrom)} not found in ${options.from}.`,
    );
  }

  if ('id' in currencyTo) {
    throw new UnsupportedOperationError(
      'Cannot select currencyTo by ID when auto-selecting is enabled. Please specify currencyTo by symbol or location.',
    );
  }

  Logger.log(
    `Selecting best exchange for asset pair ${assetFromOrigin?.symbol} -> ${JSON.stringify('symbol' in currencyTo ? currencyTo.symbol : '')}`,
  );

  const filteredExchangeChains = Array.isArray(exchange) ? exchange : EXCHANGE_CHAINS;

  let bestExchange: ExchangeChain | undefined;
  let maxAmountOut: bigint = 0n;
  const errors = new Map<TChain, Error>();
  let triedAnyExchange = false;
  for (const exchangeChain of filteredExchangeChains) {
    const dex = createExchangeInstance(exchangeChain);

    const originSpecified = from && from !== dex.chain;
    const destinationSpecified = to && to !== dex.chain;

    const assetFromExchange =
      originSpecified && assetFromOrigin
        ? getExchangeAssetByOriginAsset(dex.exchangeChain, assetFromOrigin)
        : getExchangeAsset(dex.exchangeChain, currencyFrom);

    if (!assetFromExchange) {
      continue;
    }

    const assetTo = getExchangeAsset(dex.exchangeChain, currencyTo, true);

    if (!assetTo) {
      continue;
    }

    if (destinationSpecified && !hasSupportForAsset(to, assetTo.symbol)) {
      continue;
    }

    if (from && getRelayChainOf(from) !== getRelayChainOf(dex.chain)) {
      continue;
    }

    triedAnyExchange = true;

    Logger.log(`Checking ${exchangeChain}...`);

    const res = await canBuildToExchangeTx(
      options,
      dex.chain,
      originApi,
      assetFromOrigin,
      builderOptions,
    );
    if (!res.success) {
      errors.set(dex.chain, res.error);
      continue;
    }

    const parsedAmount = applyDecimalAbstraction(
      options.amount,
      assetFromExchange?.decimals,
      !!builderOptions?.abstractDecimals,
    ).toString();

    try {
      const amountOut = await computeAmountOut(dex, assetFromExchange, assetTo, {
        ...options,
        amount: parsedAmount,
      });
      if (amountOut > maxAmountOut) {
        bestExchange = dex;
        maxAmountOut = amountOut;
      }
    } catch (e) {
      if (e instanceof Error) {
        errors.set(dex.chain, e);
      }
      continue;
    }
  }
  if (bestExchange === undefined) {
    if (!triedAnyExchange && errors.size === 0) {
      throw new RoutingResolutionError(
        `No exchange found that supports asset pair: ` +
          `${JSON.stringify(assetFromOrigin?.symbol)} -> ${JSON.stringify('symbol' in currencyTo ? currencyTo.symbol : '')}.`,
      );
    }

    throw new RoutingResolutionError(
      `Could not select best exchange automatically. Please specify one manually. Errors: \n\n${Array.from(
        errors.entries(),
      )
        .map(([key, value]) => `${key}: ${value.message}`)
        .join('\n\n')}`,
    );
  }
  Logger.log(`Selected exchange: ${bestExchange.chain}`);
  return bestExchange;
};
