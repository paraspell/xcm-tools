import type { TAsset } from '@paraspell/sdk-pjs';
import { getAssetDecimals, InvalidCurrencyError, type Extrinsic } from '@paraspell/sdk-pjs';
import ExchangeNode from '../DexNode';
import { PoolService, TradeRouter, PoolType } from '@galacticcouncil/sdk';
import { calculateFee, getAssetInfo, getMinAmountOut } from './utils';
import type { TSwapResult, TSwapOptions, TAssets } from '../../types';
import type { ApiPromise } from '@polkadot/api';
import { FEE_BUFFER } from '../../consts';
import Logger from '../../Logger/Logger';
import { SmallAmountError } from '../../errors/SmallAmountError';
import BigNumber from 'bignumber.js';

class HydrationExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: BigNumber,
  ): Promise<TSwapResult> {
    const { assetFrom, assetTo, slippagePct, amount } = options;

    const poolService = new PoolService(api);
    const tradeRouter = new TradeRouter(
      poolService,
      this.node === 'Basilisk' ? { includeOnly: [PoolType.XYK] } : undefined,
    );
    const currencyFromInfo = await getAssetInfo(tradeRouter, {
      symbol: assetFrom.symbol,
    } as TAsset);
    const currencyToInfo = await getAssetInfo(tradeRouter, {
      symbol: assetTo.symbol,
    } as TAsset);

    if (currencyFromInfo === undefined) {
      throw new InvalidCurrencyError("Currency from doesn't exist");
    } else if (currencyToInfo === undefined) {
      throw new InvalidCurrencyError("Currency to doesn't exist");
    }

    const currencyFromDecimals = currencyFromInfo?.decimals;
    const currencyToDecimals = currencyToInfo?.decimals;

    if (!currencyFromDecimals) {
      throw new InvalidCurrencyError('Decimals not found for currency from.');
    }

    if (!currencyToDecimals) {
      throw new InvalidCurrencyError('Decimals not found for currency to');
    }

    const amountBnum = BigNumber(amount);
    const tradeFee = await calculateFee(
      options,
      tradeRouter,
      currencyFromInfo,
      currencyToInfo,
      currencyFromDecimals,
      currencyFromDecimals,
      this.node,
      toDestTransactionFee,
    );
    const amountWithoutFee = amountBnum.minus(tradeFee);

    if (amountWithoutFee.isNegative()) {
      throw new SmallAmountError(
        'The provided amount is too small to cover the fees. Please provide a larger amount.',
      );
    }

    const amountNormalized = amountWithoutFee.shiftedBy(-currencyFromDecimals);

    Logger.log('Original amount', amount);
    Logger.log('Amount modified', amountWithoutFee.toString());

    const trade = await tradeRouter.getBestSell(
      currencyFromInfo.id,
      currencyToInfo.id,
      amountNormalized,
    );
    const minAmountOut = getMinAmountOut(trade.amountOut, currencyFromDecimals, slippagePct);
    const tx: Extrinsic = await trade.toTx(minAmountOut.amount).get();

    const amountOut = trade.amountOut;

    const nativeCurrencyInfo = await getAssetInfo(tradeRouter, {
      symbol: this.node === 'Hydration' ? 'HDX' : 'BSX',
    } as TAsset);

    if (nativeCurrencyInfo === undefined) {
      throw new InvalidCurrencyError('Native currency not found');
    }

    const nativeCurrencyDecimals = getAssetDecimals(this.node, nativeCurrencyInfo.symbol);

    if (nativeCurrencyDecimals === null) {
      throw new Error('Native currency decimals not found');
    }

    let priceInfo = await tradeRouter.getBestSpotPrice(currencyToInfo.id, nativeCurrencyInfo.id);

    if (currencyToInfo.id === nativeCurrencyInfo.id) {
      priceInfo = {
        amount: BigNumber(1),
        decimals: nativeCurrencyDecimals,
      };
    }

    if (priceInfo === undefined) {
      throw new Error('Price not found');
    }

    const currencyToPriceNormalNumber = priceInfo.amount.shiftedBy(-priceInfo.decimals);

    const feeNativeCurrencyNormalNumber = toDestTransactionFee.shiftedBy(-nativeCurrencyDecimals);

    const currencyToFee = feeNativeCurrencyNormalNumber
      .multipliedBy(FEE_BUFFER)
      .dividedBy(currencyToPriceNormalNumber);

    Logger.log('Amount out fee', currencyToFee.toString(), nativeCurrencyInfo.symbol);

    const currencyToFeeBnum = currencyToFee.shiftedBy(currencyToDecimals);
    const amountOutModified = amountOut.minus(currencyToFeeBnum).decimalPlaces(0);

    if (amountOutModified.isNegative()) {
      throw new SmallAmountError(
        'The amount after deducting fees is negative. Please provide a larger amount.',
      );
    }

    Logger.log('Amount out original', amountOut.toString());
    Logger.log('Amount out modified', amountOutModified.toString());

    return { tx, amountOut: amountOutModified.toString() };
  }

  async getAssets(api: ApiPromise): Promise<TAssets> {
    const poolService = new PoolService(api);
    const tradeRouter = new TradeRouter(
      poolService,
      this.node === 'Basilisk' ? { includeOnly: [PoolType.XYK] } : undefined,
    );
    const assets = await tradeRouter.getAllAssets();
    return assets.map(({ symbol, id }) => ({ symbol, id }));
  }
}

export default HydrationExchangeNode;
