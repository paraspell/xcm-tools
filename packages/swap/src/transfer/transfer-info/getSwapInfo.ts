import type { TCurrencyCore, TXcmFeeDetailSuccess } from '@paraspell/sdk-core';
import {
  assertCurrencyCore,
  buildDestInfo,
  buildOriginInfo,
  getRelayChainSymbol,
  type THopTransferInfo,
  type TTransferInfo,
} from '@paraspell/sdk-core';

import type { TBuildTransactionsOptions, TExchangeInfo } from '../../types';
import { getSwapFee } from '../fees';
import {
  canUseExecuteTransfer,
  createFromExchangeBuilder,
  createToExchangeBuilder,
  isFilteredError,
  prepareTransformedOptions,
  validateTransferOptions,
} from '../utils';
import { getExecuteSwapInfo } from './getExecuteSwapInfo';

export const buildExchangeOriginInfo = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never,
>(
  exchange: TExchangeInfo<TApi, TRes, TSigner, TCustomChain>,
  sender: string,
  amount: bigint,
  swapFee: TXcmFeeDetailSuccess,
): Promise<TTransferInfo['origin']> => {
  const { selectedCurrency, xcmFee } = await buildOriginInfo({
    api: exchange.api,
    origin: exchange.chain,
    sender,
    assets: [{ ...exchange.assetFrom, amount }],
    amount,
    originFee: swapFee.fee,
    originFeeAsset: swapFee.asset,
    isFeeAssetAh: false,
  });

  return { selectedCurrency: selectedCurrency[0], xcmFee };
};

export const buildExchangeDestInfo = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  exchange: TExchangeInfo<TApi, TRes, TSigner, TCustomChain>,
  recipient: string,
  amountOut: bigint,
  currencyTo: TCurrencyCore,
): Promise<TTransferInfo['destination']> =>
  buildDestInfo({
    api: exchange.api,
    origin: exchange.chain,
    destination: exchange.chain,
    recipient,
    currency: { ...currencyTo, amount: amountOut },
    originFee: 0n,
    isFeeAssetAh: false,
    paysDestFee: true,
    destFeeDetail: { fee: 0n, asset: exchange.assetTo, feeType: 'noFeeRequired' },
    totalHopFee: 0n,
  });

export const getSwapInfo = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  initialOptions: TBuildTransactionsOptions<TApi, TRes, TSigner, TCustomChain>,
): Promise<TTransferInfo> => {
  validateTransferOptions(initialOptions);
  const { options, dex } = await prepareTransformedOptions(initialOptions, true);

  if (canUseExecuteTransfer(dex, options)) {
    try {
      return await getExecuteSwapInfo(dex, options);
    } catch (error) {
      if (!isFilteredError(error)) throw error;
      // Fall through to routed path
    }
  }

  const { api, origin, exchange, currencyTo, destination, amount, sender, evmSenderAddress } =
    options;

  assertCurrencyCore(currencyTo);

  const senderAddress = evmSenderAddress ?? sender;

  const sendingInfo =
    origin && origin.chain !== exchange.chain
      ? await createToExchangeBuilder({
          origin,
          exchange,
          sender,
          evmSenderAddress,
          amount,
          api,
        }).getTransferInfo()
      : undefined;

  const { result: swapChain, amountOut } = await getSwapFee(dex, options);

  const receivingInfo =
    destination && destination.chain !== exchange.chain
      ? await createFromExchangeBuilder({
          exchange,
          destination,
          amount: amountOut,
          sender,
          api,
        }).getTransferInfo()
      : undefined;

  const originChain = origin?.chain ?? exchange.chain;
  const destChain = destination?.chain ?? exchange.chain;

  const exchangeHopEntry: THopTransferInfo | undefined =
    sendingInfo && receivingInfo
      ? {
          chain: exchange.chain,
          result: {
            asset: exchange.assetTo,
            xcmFee: {
              fee: swapChain.fee + receivingInfo.origin.xcmFee.fee,
              asset: swapChain.asset,
            },
            isExchange: true,
          },
        }
      : undefined;

  const hops: THopTransferInfo[] = [
    ...(sendingInfo?.hops ?? []),
    ...(exchangeHopEntry ? [exchangeHopEntry] : []),
    ...(receivingInfo?.hops ?? []),
  ];

  const finalOrigin =
    sendingInfo?.origin ??
    (await buildExchangeOriginInfo(exchange, senderAddress, amount, swapChain));

  const finalDestination =
    receivingInfo?.destination ??
    (await buildExchangeDestInfo(exchange, sender, amountOut, currencyTo));

  return {
    chain: {
      origin: originChain,
      destination: destChain,
      ecosystem: getRelayChainSymbol(originChain),
    },
    origin: { ...finalOrigin, ...(!sendingInfo && { isExchange: true }) },
    hops,
    destination: { ...finalDestination, ...(!receivingInfo && { isExchange: true }) },
  };
};
