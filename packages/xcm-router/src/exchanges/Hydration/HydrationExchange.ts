import { createSdkContext } from '@galacticcouncil/sdk';
import {
  getAssetDecimals,
  getAssets,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  InvalidParameterError,
  isForeignAsset,
} from '@paraspell/sdk';
import type { ApiPromise } from '@polkadot/api';
import BigNumber from 'bignumber.js';

import { DEST_FEE_BUFFER_PCT, FEE_BUFFER } from '../../consts';
import { SmallAmountError } from '../../errors/SmallAmountError';
import Logger from '../../Logger/Logger';
import type {
  TDexConfig,
  TGetAmountOutOptions,
  TSingleSwapResult,
  TSwapOptions,
} from '../../types';
import ExchangeChain from '../ExchangeChain';
import { calculateFee, getAssetInfo } from './utils';

class HydrationExchange extends ExchangeChain {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: BigNumber,
  ): Promise<TSingleSwapResult> {
    const { origin, assetFrom, assetTo, senderAddress, slippagePct, amount } = options;

    const {
      api: { router: tradeRouter },
      tx: txBuilderFactory,
    } = createSdkContext(api);

    const currencyFromInfo = await getAssetInfo(tradeRouter, assetFrom);
    const currencyToInfo = await getAssetInfo(tradeRouter, assetTo);

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
      txBuilderFactory,
      currencyFromInfo,
      currencyToInfo,
      currencyFromDecimals,
      this.chain,
      toDestTransactionFee,
    );
    const amountWithoutFee = origin ? amountBnum.minus(tradeFee) : amountBnum;

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

    const substrateTx = await txBuilderFactory
      .trade(trade)
      .withSlippage(Number(slippagePct))
      .withBeneficiary(senderAddress)
      .build();

    const tx = substrateTx.get();

    const amountOut = trade.amountOut;

    const nativeCurrencyInfo = await getAssetInfo(tradeRouter, {
      symbol: getNativeAssetSymbol(this.chain),
    });

    if (nativeCurrencyInfo === undefined) {
      throw new InvalidCurrencyError('Native currency not found');
    }

    const nativeCurrencyDecimals = getAssetDecimals(this.chain, nativeCurrencyInfo.symbol);

    if (nativeCurrencyDecimals === null) {
      throw new InvalidParameterError('Native currency decimals not found');
    }

    let priceInfo = await tradeRouter.getBestSpotPrice(currencyToInfo.id, nativeCurrencyInfo.id);

    if (currencyToInfo.id === nativeCurrencyInfo.id) {
      priceInfo = {
        amount: BigNumber(1000000000000),
        decimals: nativeCurrencyDecimals,
      };
    }

    if (priceInfo === undefined) {
      throw new InvalidParameterError('Price not found');
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
        'The provided amount is too small to cover the fees. Please provide a larger amount.',
      );
    }

    Logger.log('Amount out original', amountOut.toString());
    Logger.log('Amount out modified', amountOutModified.toString());

    return { tx, amountOut: amountOutModified.toString() };
  }

  async getAmountOut(api: ApiPromise, options: TGetAmountOutOptions): Promise<bigint> {
    const { assetFrom, assetTo, amount, origin, slippagePct = '0' } = options;

    const {
      api: { router: tradeRouter },
    } = createSdkContext(api);

    const currencyFromInfo = await getAssetInfo(tradeRouter, assetFrom);
    const currencyToInfo = await getAssetInfo(tradeRouter, assetTo);

    if (currencyFromInfo === undefined) {
      throw new InvalidCurrencyError("Currency from doesn't exist");
    }

    if (currencyToInfo === undefined) {
      throw new InvalidCurrencyError("Currency to doesn't exist");
    }

    const currencyFromDecimals = currencyFromInfo?.decimals;
    const currencyToDecimals = currencyToInfo?.decimals;

    if (!currencyFromDecimals) {
      throw new InvalidCurrencyError('Decimals not found for currency from');
    }

    if (!currencyToDecimals) {
      throw new InvalidCurrencyError('Decimals not found for currency to');
    }

    const amountBN = BigNumber(amount);
    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;
    const amountWithoutFee = amountBN.minus(amountBN.times(pctDestFee));

    const amountNormalized = amountWithoutFee.shiftedBy(-currencyFromDecimals);

    const trade = await tradeRouter.getBestSell(
      currencyFromInfo.id,
      currencyToInfo.id,
      amountNormalized,
    );

    const amountOut = trade.amountOut;
    const slippageDecimal = BigNumber(slippagePct).dividedBy(100);
    const amountOutWithSlippage = amountOut.minus(amountOut.times(slippageDecimal));

    return BigInt(amountOutWithSlippage.decimalPlaces(0).toString());
  }

  async getDexConfig(api: ApiPromise): Promise<TDexConfig> {
    const {
      api: { router: tradeRouter },
    } = createSdkContext(api);

    const assets = await tradeRouter.getAllAssets();

    const sdkAssets = getAssets(this.chain);

    const transformedAssets = assets.map(({ symbol, id, decimals }) => {
      const asset =
        sdkAssets.find((a) => isForeignAsset(a) && a.assetId === id) ??
        sdkAssets.find((a) => a.symbol.toLowerCase() === symbol.toLowerCase());

      return {
        symbol,
        decimals,
        assetId: asset && isForeignAsset(asset) ? asset.assetId : undefined,
        location: asset?.location,
      };
    });

    return {
      isOmni: true,
      assets: transformedAssets,
      pairs: [],
    };
  }
}

export default HydrationExchange;
