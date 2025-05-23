import type { TCurrencyInput, TXcmFeeDetail } from '@paraspell/sdk';
import { getOriginXcmFee } from '@paraspell/sdk';

import type ExchangeNode from '../../dexNodes/DexNode';
import type { TBuildTransactionsOptionsModified } from '../../types';
import { createSwapTx } from '../createSwapTx';

export const getSwapFee = async (
  exchange: ExchangeNode,
  options: TBuildTransactionsOptionsModified,
) => {
  const { senderAddress } = options;
  const { tx, amountOut } = await createSwapTx(exchange, options);

  const result = await getOriginXcmFee({
    api: options.exchange.apiPapi,
    tx,
    origin: exchange.node,
    destination: exchange.node,
    senderAddress: senderAddress,
    currency: {} as TCurrencyInput,
    disableFallback: false,
  });

  return {
    result: {
      fee: result.fee,
      feeType: result.feeType,
      currency: result.currency,
      dryRunError: result.dryRunError,
    } as TXcmFeeDetail,
    amountOut,
  };
};
