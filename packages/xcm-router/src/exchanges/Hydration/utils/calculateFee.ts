import type { Asset, TradeRouter, TxBuilderFactory } from '@galacticcouncil/sdk';
import {
  getAssetDecimals,
  getNativeAssetSymbol,
  InvalidParameterError,
  type TChain,
} from '@paraspell/sdk';
import BigNumber from 'bignumber.js';

import { FEE_BUFFER } from '../../../consts';
import Logger from '../../../Logger/Logger';
import type { TSwapOptions } from '../../../types';
import { calculateTxFeePjs } from '../../../utils';
import { getAssetInfo } from './utils';

export const calculateFee = async (
  {
    amount,
    slippagePct,
    feeCalcAddress,
    senderAddress,
  }: Pick<TSwapOptions, 'amount' | 'slippagePct' | 'feeCalcAddress' | 'senderAddress'>,
  tradeRouter: TradeRouter,
  txBuilderFactory: TxBuilderFactory,
  currencyFromInfo: Asset,
  currencyToInfo: Asset,
  currencyFromDecimals: number,
  chain: TChain,
  toDestTransactionFee: BigNumber,
): Promise<BigNumber> => {
  const amountBnum = BigNumber(amount);

  const trade = await tradeRouter.getBestSell(
    currencyFromInfo.id,
    currencyToInfo.id,
    amountBnum.toString(),
  );

  const nativeCurrencyInfo = await getAssetInfo(tradeRouter, {
    symbol: getNativeAssetSymbol(chain),
  });

  if (nativeCurrencyInfo === undefined) {
    throw new InvalidParameterError('Native currency not found');
  }

  const nativeCurrencyDecimals = getAssetDecimals(chain, nativeCurrencyInfo.symbol);

  if (nativeCurrencyDecimals === null) {
    throw new InvalidParameterError('Native currency decimals not found');
  }

  const substrateTx = await txBuilderFactory
    .trade(trade)
    .withSlippage(Number(slippagePct))
    .withBeneficiary(senderAddress)
    .build();

  const tx = substrateTx.get();

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
