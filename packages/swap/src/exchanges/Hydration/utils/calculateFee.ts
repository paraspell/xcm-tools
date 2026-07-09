import type { Asset } from '@galacticcouncil/sdk-next';
import type { TradeRouter } from '@galacticcouncil/sdk-next/sor';
import type { TxBuilderFactory } from '@galacticcouncil/sdk-next/tx';
import {
  findNativeAssetInfoOrThrow,
  padValueBy,
  type TChain,
  UnableToComputeError,
} from '@paraspell/sdk-core';

import { FEE_BUFFER_PCT } from '../../../consts';
import Logger from '../../../Logger/Logger';
import type { TSwapOptions } from '../../../types';
import { pow10n } from '../../../utils';

export const calculateFee = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  { amount, slippagePct, feeCalcAddress, sender }: TSwapOptions<TApi, TRes, TSigner, TCustomChain>,
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

  const nativeAsset = findNativeAssetInfoOrThrow(chain);

  const substrateTx = await txBuilderFactory
    .trade(trade)
    .withSlippage(Number(slippagePct))
    .withBeneficiary(sender)
    .build();

  const tx = substrateTx.get();

  const { partial_fee: swapFee } = await tx.getPaymentInfo(feeCalcAddress);
  const feeNative = swapFee + toDestTransactionFee + toDestTransactionFee;

  Logger.log('XCM to exch. fee:', toDestTransactionFee, nativeAsset.symbol);
  Logger.log('XCM to dest. fee:', toDestTransactionFee, nativeAsset.symbol);
  Logger.log('Swap fee:', swapFee, nativeAsset.symbol);
  Logger.log('Total fee:', feeNative, nativeAsset.symbol);

  if (currencyFromInfo.symbol === nativeAsset.symbol) return feeNative;

  const currencyFromPriceInfo = await tradeRouter.getSpotPrice(
    currencyFromInfo.id,
    Number(nativeAsset.assetId),
  );

  if (currencyFromPriceInfo === undefined) {
    throw new UnableToComputeError('Price not found');
  }

  const currencyFromPrice = currencyFromPriceInfo.amount;

  const feeInCurrencyFrom =
    (feeNative * pow10n(currencyFromPriceInfo.decimals + currencyFromDecimals)) /
    (currencyFromPrice * pow10n(nativeAsset.decimals));

  Logger.log('Total fee in currency from:', feeInCurrencyFrom, currencyFromInfo.symbol);

  const finalFee = padValueBy(feeInCurrencyFrom, FEE_BUFFER_PCT);

  Logger.log(
    `Total fee in currency from with buffer ${FEE_BUFFER_PCT}%:`,
    finalFee,
    currencyFromInfo.symbol,
  );

  return finalFee;
};
