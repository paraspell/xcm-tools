import { type Extrinsic, InvalidCurrencyError, getAssetDecimals } from '@paraspell/sdk';
import ExchangeNode from '../DexNode';
import { PoolService, TradeRouter, BigNumber, PoolType } from '@galacticcouncil/sdk';
import { calculateFee, getAssetInfo, getMinAmountOut } from './utils';
import { type TSwapResult, type TSwapOptions, type TAssetSymbols } from '../../types';
import { type ApiPromise } from '@polkadot/api';
import { FEE_BUFFER } from '../../consts/consts';
import Logger from '../../Logger/Logger';

class HydraDxExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: BigNumber,
  ): Promise<TSwapResult> {
    const { currencyFrom, currencyTo, slippagePct, amount } = options;
    const poolService = new PoolService(api);
    const tradeRouter = new TradeRouter(
      poolService,
      this.node === 'Basilisk' ? { includeOnly: [PoolType.XYK] } : undefined,
    );
    const currencyFromInfo = await getAssetInfo(tradeRouter, currencyFrom);
    const currencyToInfo = await getAssetInfo(tradeRouter, currencyTo);

    const currencyFromDecimals = getAssetDecimals(this.node, currencyFrom);
    const currencyToDecimals = getAssetDecimals(this.node, currencyTo);

    if (currencyFromDecimals === null || currencyToDecimals === null) {
      throw new InvalidCurrencyError('Decimals not found for currency from');
    }

    if (currencyFromInfo === undefined) {
      throw new InvalidCurrencyError("Currency from doesn't exist");
    } else if (currencyToInfo === undefined) {
      throw new InvalidCurrencyError("Currency to doesn't exist");
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
      throw new Error(
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

    const nativeCurrencyInfo = await getAssetInfo(
      tradeRouter,
      this.node === 'HydraDX' ? 'HDX' : 'BSX',
    );

    if (nativeCurrencyInfo === undefined) {
      throw new InvalidCurrencyError('Native currency not found');
    }

    const nativeCurrencyDecimals = getAssetDecimals(this.node, nativeCurrencyInfo.symbol);

    if (nativeCurrencyDecimals === null) {
      throw new Error('Native currency decimals not found');
    }

    const priceInfo = await tradeRouter.getBestSpotPrice(currencyToInfo.id, nativeCurrencyInfo.id);

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
      throw new Error(
        'The amount after deducting fees is negative. Please provide a larger amount.',
      );
    }

    Logger.log('Amount out original', amountOut.toString());
    Logger.log('Amount out modified', amountOutModified.toString());

    return { tx, amountOut: amountOutModified.toString() };
  }

  async getAssetSymbols(api: ApiPromise): Promise<TAssetSymbols> {
    const poolService = new PoolService(api);
    const tradeRouter = new TradeRouter(
      poolService,
      this.node === 'Basilisk' ? { includeOnly: [PoolType.XYK] } : undefined,
    );
    const assets = await tradeRouter.getAllAssets();
    return assets.map((asset) => asset.symbol);
  }
}

export default HydraDxExchangeNode;
