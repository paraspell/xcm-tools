import type { Wallet } from '@acala-network/sdk';
import { FixedPointNumber, type Token } from '@acala-network/sdk-core';
import type { AggregateDex } from '@acala-network/sdk-swap';
import type { TSwapOptions } from '../../../types';
import BigNumber from 'bignumber.js';
import { firstValueFrom } from 'rxjs';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import { calculateTransactionFee } from '../../../utils/utils';
import Logger from '../../../Logger/Logger';
import { convertCurrency } from './utils';
import { FEE_BUFFER } from '../../../consts';

export const calculateAcalaTransactionFee = async (
  dex: AggregateDex,
  wallet: Wallet,
  tokenFrom: Token,
  tokenTo: Token,
  { amount, feeCalcAddress }: TSwapOptions,
  toDestTransactionFee: BigNumber,
): Promise<BigNumber> => {
  const normalNumberAmount = new BigNumber(amount).shiftedBy(-tokenFrom.decimals).toString();

  const feeCalculationResult = await firstValueFrom(
    dex.swap({
      path: [tokenFrom, tokenTo],
      source: 'aggregate',
      mode: 'EXACT_INPUT',
      input: new FixedPointNumber(normalNumberAmount, tokenFrom.decimals),
    }),
  );

  const txForFeeCalculation = dex.getTradingTx(feeCalculationResult) as unknown as Extrinsic;

  const swapFee = await calculateTransactionFee(txForFeeCalculation, feeCalcAddress);
  const swapFeeNativeCurrency = new BigNumber(swapFee.toString());

  const nativeCurrency = wallet.consts.nativeCurrency;

  const feeInNativeCurrency = swapFeeNativeCurrency.plus(toDestTransactionFee);

  Logger.log('XCM to dest. fee:', toDestTransactionFee.toString(), nativeCurrency);
  Logger.log('Swap fee:', swapFeeNativeCurrency.toString(), nativeCurrency);
  Logger.log('Total fee:', feeInNativeCurrency.toString(), nativeCurrency);

  if (tokenFrom.symbol === nativeCurrency) return feeInNativeCurrency;

  const nativeCurrencyDecimals = wallet.getToken(nativeCurrency).decimals;

  const convertedFeeNativeCurrency = feeInNativeCurrency
    .shiftedBy(-nativeCurrencyDecimals)
    .toNumber();

  Logger.log('Total fee human:', convertedFeeNativeCurrency.toString(), nativeCurrency);

  const feeInCurrencyFrom = await convertCurrency(
    wallet,
    nativeCurrency,
    tokenFrom.symbol,
    convertedFeeNativeCurrency,
  );

  const feeInCurrencyFromWithBuffer = feeInCurrencyFrom * FEE_BUFFER;

  Logger.log('Fee total currency from', feeInCurrencyFromWithBuffer.toString(), tokenFrom.symbol);

  const feeInCurrencyFromBN = new BigNumber(feeInCurrencyFromWithBuffer).shiftedBy(
    tokenFrom.decimals,
  );

  Logger.log('Fee total currency from BN', feeInCurrencyFromBN.toString(), tokenFrom.symbol);

  return feeInCurrencyFromBN;
};
