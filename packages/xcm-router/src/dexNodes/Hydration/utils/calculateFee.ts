import type { Asset, TradeRouter } from '@galacticcouncil/sdk';
import {
  getAssetDecimals,
  getNativeAssetSymbol,
  InvalidParameterError,
  type TNode,
} from '@paraspell/sdk';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import BigNumber from 'bignumber.js';

import { FEE_BUFFER } from '../../../consts';
import Logger from '../../../Logger/Logger';
import type { TSwapOptions } from '../../../types';
import { calculateTxFeePjs } from '../../../utils';
import { getAssetInfo, getMinAmountOut } from './utils';

export const calculateFee = async (
  {
    amount,
    slippagePct,
    feeCalcAddress,
  }: Pick<TSwapOptions, 'amount' | 'slippagePct' | 'feeCalcAddress'>,
  tradeRouter: TradeRouter,
  currencyFromInfo: Asset,
  currencyToInfo: Asset,
  currencyFromDecimals: number,
  currencyToDecimals: number,
  node: TNode,
  toDestTransactionFee: BigNumber,
): Promise<BigNumber> => {
  const amountBnum = BigNumber(amount);

  const trade = await tradeRouter.getBestSell(
    currencyFromInfo.id,
    currencyToInfo.id,
    amountBnum.toString(),
  );
  const minAmountOut = getMinAmountOut(trade.amountOut, currencyToDecimals, slippagePct);

  const nativeCurrencyInfo = await getAssetInfo(tradeRouter, {
    symbol: getNativeAssetSymbol(node),
  });

  if (nativeCurrencyInfo === undefined) {
    throw new InvalidParameterError('Native currency not found');
  }

  const nativeCurrencyDecimals = getAssetDecimals(node, nativeCurrencyInfo.symbol);

  if (nativeCurrencyDecimals === null) {
    throw new InvalidParameterError('Native currency decimals not found');
  }

  const tx = trade.toTx(minAmountOut.amount).get<Extrinsic>();
  const swapFee = await calculateTxFeePjs(tx, feeCalcAddress);
  const swapFeeNativeCurrency = new BigNumber(swapFee.toString());
  const feeInNativeCurrency = swapFeeNativeCurrency
    .plus(toDestTransactionFee)
    .plus(toDestTransactionFee);

  Logger.log('XCM to exch. fee:', toDestTransactionFee.toString(), nativeCurrencyInfo.symbol);
  Logger.log('XCM to dest. fee:', toDestTransactionFee.toString(), nativeCurrencyInfo.symbol);
  Logger.log('Swap fee:', swapFee.toString(), nativeCurrencyInfo.symbol);
  Logger.log('Total fee:', feeInNativeCurrency.toString(), nativeCurrencyInfo.symbol);

  if (currencyFromInfo.symbol === nativeCurrencyInfo.symbol) return feeInNativeCurrency;

  const feeNativeCurrencyNormalNumber = feeInNativeCurrency.shiftedBy(-nativeCurrencyDecimals);

  const currencyFromPriceInfo = await tradeRouter.getBestSpotPrice(
    currencyFromInfo.id,
    nativeCurrencyInfo.id,
  );

  if (currencyFromPriceInfo === undefined) {
    throw new InvalidParameterError('Price not found');
  }

  const currencyFromPrice = currencyFromPriceInfo.amount;
  const currencyFromPriceNormalNumber = currencyFromPrice.shiftedBy(
    -currencyFromPriceInfo.decimals,
  );

  const currencyFromFee = feeNativeCurrencyNormalNumber.dividedBy(currencyFromPriceNormalNumber);

  Logger.log(
    'Total fee in currency from:',
    currencyFromFee.toString(),
    ' ',
    currencyFromInfo.symbol,
  );

  const finalFee = currencyFromFee.multipliedBy(FEE_BUFFER);

  Logger.log(
    'Total fee in currency from with buffer 10%:',
    finalFee.toString(),
    ' ',
    currencyFromInfo.symbol,
  );

  return finalFee.shiftedBy(currencyFromDecimals);
};
