import type { TXcmFeeDetail } from '@paraspell/sdk';
import { getOriginXcmFee } from '@paraspell/sdk';

import type ExchangeNode from '../../dexNodes/DexNode';
import type { TBuildTransactionsOptionsModified } from '../../types';
import { createSwapTx } from '../createSwapTx';

export const getSwapFee = async (
  exchange: ExchangeNode,
  options: TBuildTransactionsOptionsModified,
) => {
  const {
    senderAddress,
    exchange: { assetFrom },
    amount,
  } = options;
  const { txs, amountOut } = await createSwapTx(exchange, options);

  const currency = assetFrom.multiLocation
    ? {
        multilocation: assetFrom.multiLocation,
        amount,
      }
    : {
        symbol: assetFrom.symbol,
        amount,
      };

  const result = await getOriginXcmFee({
    api: options.exchange.apiPapi,
    tx: txs[0],
    origin: exchange.node,
    destination: exchange.node,
    senderAddress: senderAddress,
    currency,
    disableFallback: false,
  });

  const finalFee = (result.fee as bigint) * BigInt(txs.length);

  return {
    result: {
      fee: finalFee,
      feeType: result.feeType,
      currency: result.currency,
      dryRunError: result.dryRunError,
    } as TXcmFeeDetail,
    amountOut,
  };
};
