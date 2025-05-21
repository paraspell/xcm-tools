import type ExchangeNode from '../dexNodes/DexNode';
import type { TBuildTransactionsOptionsModified, TRouterXcmFeeResult } from '../types';
import { getSwapFee } from './fees';
import { getFromExchangeFee, getToExchangeFee } from './utils';

export const getRouterFees = async (
  dex: ExchangeNode,
  options: TBuildTransactionsOptionsModified,
): Promise<TRouterXcmFeeResult> => {
  const { origin, exchange, destination, senderAddress } = options;

  // 1. Get fees for origin -> exchange (optional)
  const sendingChain =
    origin && origin.node !== exchange.baseNode
      ? await getToExchangeFee({ ...options, origin })
      : undefined;

  // 2. Get fees for swap in DEX (always)
  const { result: swapChain, amountOut } = await getSwapFee(dex, options);

  // 3. Get fees for exchange -> destination (optional)
  const receivingChain =
    destination && destination.node !== exchange.baseNode
      ? await getFromExchangeFee({
          exchange,
          destination,
          amount: amountOut,
          senderAddress,
        })
      : undefined;

  return {
    sendingChain,
    exchangeChain: { ...swapChain, selectedExchange: exchange.exchangeNode },
    receivingChain,
  };
};
