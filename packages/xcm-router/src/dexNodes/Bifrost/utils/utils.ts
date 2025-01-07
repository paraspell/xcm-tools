import { Amount, Native, type Token } from '@crypto-dex-sdk/currency';
import BigNumber from 'bignumber.js';
import { getBestTrade } from './bifrostUtils';
import { type Pool } from '@crypto-dex-sdk/amm';
import Logger from '../../../Logger/Logger';

export const convertAmount = (
  feeAmount: BigNumber,
  token: Token,
  chainId: number,
  pairs: Pool[],
): BigNumber => {
  const native = Native.onChain(chainId);
  if (token.symbol === native.symbol) {
    return feeAmount;
  }

  const feeNumber = new BigNumber(feeAmount).shiftedBy(-native.decimals).toNumber();

  const one = new BigNumber(1).shiftedBy(token.decimals);

  const amountIn = Amount.fromRawAmount(token, one.toString());

  const trade = getBestTrade(chainId, pairs, amountIn, native);
  Logger.log('price is', trade.executionPrice.toFixed());

  const price = trade.executionPrice.toFixed();

  const calculatedFeeNumber = feeNumber / Number(price);

  return new BigNumber(calculatedFeeNumber).shiftedBy(token.decimals);
};
