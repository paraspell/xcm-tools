import { createApiInstanceForNode, InvalidParameterError } from '@paraspell/sdk';

import { supportsExchangePair } from '../../assets';
import type ExchangeNode from '../../dexNodes/DexNode';
import { createDexNodeInstance } from '../../dexNodes/DexNodeFactory';
import type { TAdditionalTransferOptions } from '../../types';
import { type TBuildTransactionsOptions, type TTransferOptions } from '../../types';
import { selectBestExchange } from '../selectBestExchange';
import { resolveAssets } from './resolveAssets';
import { determineFeeCalcAddress } from './utils';

export const prepareTransformedOptions = async <
  T extends TTransferOptions | TBuildTransactionsOptions,
>(
  options: T,
): Promise<{ dex: ExchangeNode; options: T & TAdditionalTransferOptions }> => {
  const { from, to, exchange, senderAddress, recipientAddress } = options;

  const dex =
    exchange !== undefined && !Array.isArray(exchange)
      ? createDexNodeInstance(exchange)
      : await selectBestExchange(options);

  const { assetFromOrigin, assetFromExchange, assetTo } = resolveAssets(dex, options);

  if (!supportsExchangePair(dex.exchangeNode, assetFromExchange, assetTo)) {
    throw new InvalidParameterError(
      `Exchange ${dex.node} does not support the pair ${assetFromExchange.symbol} -> ${assetTo.symbol}`,
    );
  }

  const originSpecified = from && from !== dex.node;
  const destinationSpecified = to && to !== dex.node;

  return {
    dex,
    options: {
      ...options,
      origin:
        originSpecified && assetFromOrigin
          ? {
              api: await createApiInstanceForNode(from),
              node: from,
              assetFrom: assetFromOrigin,
            }
          : undefined,
      exchange: {
        api: await dex.createApiInstance(),
        apiPapi: await dex.createApiInstancePapi(),
        baseNode: dex.node,
        exchangeNode: dex.exchangeNode,
        assetFrom: assetFromExchange,
        assetTo,
      },
      destination:
        destinationSpecified && recipientAddress
          ? {
              node: to,
              address: recipientAddress,
            }
          : undefined,
      feeCalcAddress: determineFeeCalcAddress(senderAddress, recipientAddress),
    },
  };
};
