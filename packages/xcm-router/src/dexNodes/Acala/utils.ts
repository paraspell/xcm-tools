import { ApiPromise, WsProvider } from '@polkadot/api';
import { options } from '@acala-network/api';
import type { TNodePolkadotKusama } from '@paraspell/sdk';
import { getNodeProvider, type Extrinsic } from '@paraspell/sdk';
import BigNumber from 'bignumber.js';
import { type Wallet } from '@acala-network/sdk';
import { type TSwapOptions } from '../../types';
import { type AggregateDex } from '@acala-network/sdk-swap';
import { FixedPointNumber, type Token } from '@acala-network/sdk-core';
import { firstValueFrom } from 'rxjs';
import { FEE_BUFFER } from '../../consts/consts';
import { calculateTransactionFee } from '../../utils/utils';
import Logger from '../../Logger/Logger';

export const createAcalaApiInstance = async (node: TNodePolkadotKusama): Promise<ApiPromise> => {
  const provider = new WsProvider(getNodeProvider(node), 100);
  const api = new ApiPromise(
    options({
      provider,
    }),
  );
  await api.isReady;
  return api;
};

export const convertCurrency = async (
  wallet: Wallet,
  nativeCurrencySymbol: string,
  otherCurrencySymbol: string,
  otherCurrencyAmount: number,
): Promise<number> => {
  const nativeUsdPrice = (await wallet.getPrice(nativeCurrencySymbol)).toNumber();
  const otherUsdPrice = (await wallet.getPrice(otherCurrencySymbol)).toNumber();

  if (otherUsdPrice === 0) {
    throw new Error(`Could not fetch price for ${otherCurrencySymbol}`);
  }

  const feeInUsd = otherCurrencyAmount * nativeUsdPrice;
  return feeInUsd / otherUsdPrice;
};

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
