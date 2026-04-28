import type { TTransferInfo } from '@paraspell/sdk-core';
import {
  aggregateHopFees,
  assertCurrencyCore,
  buildDestInfo,
  buildOriginInfo,
  findAssetInfoOrThrow,
  getRelayChainSymbol,
} from '@paraspell/sdk-core';

import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TBuildTransactionsOptions, TTransformedOptions } from '../../types';
import { getSwapExecuteXcmFee } from '../utils';
import { buildExecuteSwapHops } from './buildExecuteSwapHops';

export const getExecuteSwapInfo = async <TApi, TRes, TSigner>(
  dex: ExchangeChain,
  options: TTransformedOptions<TBuildTransactionsOptions<TApi, TRes, TSigner>, TApi, TRes, TSigner>,
): Promise<TTransferInfo> => {
  const {
    api,
    origin,
    exchange,
    currencyFrom,
    currencyTo,
    destination,
    amount,
    sender,
    recipient,
    evmSenderAddress,
  } = options;

  assertCurrencyCore(currencyFrom);
  assertCurrencyCore(currencyTo);

  const { result: xcmFeeResult, amountOut } = await getSwapExecuteXcmFee(dex, options, false);

  const originChain = origin?.chain ?? exchange.chain;
  const destChain = destination?.chain ?? exchange.chain;
  const senderAddress = evmSenderAddress ?? sender;
  const recipientAddress = recipient ?? sender;

  const originAsset = origin
    ? findAssetInfoOrThrow(originChain, currencyFrom, destChain)
    : exchange.assetFrom;

  const originInfo = await buildOriginInfo({
    api,
    origin: originChain,
    sender: senderAddress,
    currency: currencyFrom,
    originAsset,
    amount: BigInt(amount),
    originFee: xcmFeeResult.origin.fee,
    originFeeAsset: xcmFeeResult.origin.asset,
    isFeeAssetAh: false,
  });

  const builtHops = await buildExecuteSwapHops({
    api,
    hops: xcmFeeResult.hops,
    originChain,
    exchangeChain: exchange.chain,
    currencyFrom,
    currencyTo,
    sender: senderAddress,
  });

  const exchangeHopIdx = xcmFeeResult.hops.findIndex((h) => h.chain === exchange.chain);
  const postSwapHops =
    exchangeHopIdx >= 0 ? xcmFeeResult.hops.slice(exchangeHopIdx + 1) : xcmFeeResult.hops;
  const { totalHopFee, bridgeFee } = aggregateHopFees(postSwapHops, exchange.assetTo);

  const destinationInfo = await buildDestInfo({
    api,
    origin: originChain,
    destination: destChain,
    recipient: recipientAddress,
    currency: { ...currencyTo, amount: amountOut },
    originFee: xcmFeeResult.origin.fee,
    isFeeAssetAh: false,
    destFeeDetail: xcmFeeResult.destination,
    totalHopFee,
    bridgeFee,
  });

  return {
    chain: {
      origin: originChain,
      destination: destChain,
      ecosystem: getRelayChainSymbol(originChain),
    },
    origin: { ...originInfo, ...(!origin && { isExchange: true }) },
    hops: builtHops,
    destination: { ...destinationInfo, ...(!destination && { isExchange: true }) },
  };
};
