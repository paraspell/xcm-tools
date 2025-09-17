import type { TXcmFeeDetail } from '@paraspell/sdk';
import { applyDecimalAbstraction, getOriginXcmFee } from '@paraspell/sdk';

import { SWAP_BYPASS_AMOUNT } from '../../consts';
import type ExchangeChain from '../../exchanges/ExchangeChain';
import type { TBuildTransactionsOptionsModified } from '../../types';
import { createSwapTx } from '../createSwapTx';

export const getSwapFee = async (
  exchange: ExchangeChain,
  options: TBuildTransactionsOptionsModified,
) => {
  const {
    senderAddress,
    exchange: { assetFrom },
    amount,
  } = options;
  const { txs, amountOut } = await createSwapTx(exchange, options);
  const { txs: txsBypass } = await createSwapTx(exchange, {
    ...options,
    amount: applyDecimalAbstraction(SWAP_BYPASS_AMOUNT, assetFrom.decimals, true).toString(),
  });

  const currency = assetFrom.location
    ? {
        location: assetFrom.location,
        amount: BigInt(amount),
      }
    : {
        symbol: assetFrom.symbol,
        amount: BigInt(amount),
      };

  const result = await getOriginXcmFee({
    api: options.exchange.apiPapi,
    txs: { tx: txs[0], txBypass: txsBypass[0] },
    origin: exchange.chain,
    destination: exchange.chain,
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
