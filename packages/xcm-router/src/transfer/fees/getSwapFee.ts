import type { TXcmFeeDetail } from '@paraspell/sdk';
import { AmountTooLowError, applyDecimalAbstraction, getOriginXcmFee } from '@paraspell/sdk';

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
  let txs: unknown[];
  let amountOut: string;

  try {
    const swapResult = await createSwapTx(exchange, options);
    txs = swapResult.txs;
    amountOut = swapResult.amountOut;
  } catch (e: unknown) {
    if (!(e instanceof AmountTooLowError)) throw e;
    txs = [null];
    amountOut = '0';
  }

  const currency = assetFrom.location
    ? {
        location: assetFrom.location,
        amount: BigInt(amount),
      }
    : {
        symbol: assetFrom.symbol,
        amount: BigInt(amount),
      };

  const buildTx = async (overrideAmount?: string) => {
    const txOptions = {
      ...options,
      ...(overrideAmount
        ? { amount: applyDecimalAbstraction(overrideAmount, assetFrom.decimals, true).toString() }
        : {}),
    };
    const { txs } = await createSwapTx(exchange, txOptions);
    return txs[0];
  };

  const result = await getOriginXcmFee({
    api: options.exchange.apiPapi,
    buildTx,
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
