import type { Asset, TradeRouter, TxBuilderFactory } from '@galacticcouncil/sdk';
import {
  getAssetDecimals,
  getNativeAssetSymbol,
  InvalidParameterError,
  padValueBy,
  type TChain,
} from '@paraspell/sdk';

import { FEE_BUFFER_PCT } from '../../../consts';
import Logger from '../../../Logger/Logger';
import type { TSwapOptions } from '../../../types';
import { calculateTxFeePjs, pow10n } from '../../../utils';
import { getAssetInfo } from './utils';

export const calculateFee = async (
  { amount, slippagePct, feeCalcAddress, senderAddress }: TSwapOptions,
  tradeRouter: TradeRouter,
  txBuilderFactory: TxBuilderFactory,
  currencyFromInfo: Asset,
  currencyToInfo: Asset,
  currencyFromDecimals: number,
  chain: TChain,
  toDestTransactionFee: bigint,
): Promise<bigint> => {
  const trade = await tradeRouter.getBestSell(
    currencyFromInfo.id,
    currencyToInfo.id,
    amount.toString(),
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
  const feeNative = swapFee + toDestTransactionFee + toDestTransactionFee;

  Logger.log('XCM to exch. fee:', toDestTransactionFee, nativeCurrencyInfo.symbol);
  Logger.log('XCM to dest. fee:', toDestTransactionFee, nativeCurrencyInfo.symbol);
  Logger.log('Swap fee:', swapFee, nativeCurrencyInfo.symbol);
  Logger.log('Total fee:', feeNative, nativeCurrencyInfo.symbol);

  if (currencyFromInfo.symbol === nativeCurrencyInfo.symbol) return feeNative;

  const currencyFromPriceInfo = await tradeRouter.getBestSpotPrice(
    currencyFromInfo.id,
    nativeCurrencyInfo.id,
  );

  if (currencyFromPriceInfo === undefined) {
    throw new InvalidParameterError('Price not found');
  }

  const currencyFromPrice = BigInt(currencyFromPriceInfo.amount.decimalPlaces(0).toString());

  const feeInCurrencyFrom =
    (feeNative * pow10n(currencyFromPriceInfo.decimals + currencyFromDecimals)) /
    (currencyFromPrice * pow10n(nativeCurrencyDecimals));

  Logger.log('Total fee in currency from:', feeInCurrencyFrom, currencyFromInfo.symbol);

  const finalFee = padValueBy(feeInCurrencyFrom, FEE_BUFFER_PCT);

  Logger.log(
    `Total fee in currency from with buffer ${FEE_BUFFER_PCT}%:`,
    finalFee,
    currencyFromInfo.symbol,
  );

  return finalFee;
};
