import { PoolService, PoolType, TradeRouter } from '@galacticcouncil/sdk';
import type { TForeignAsset } from '@paraspell/sdk-pjs';
import {
  type Extrinsic,
  getAssetDecimals,
  getAssets,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  InvalidParameterError,
} from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import BigNumber from 'bignumber.js';

import { DEST_FEE_BUFFER_PCT, FEE_BUFFER } from '../../consts';
import { SmallAmountError } from '../../errors/SmallAmountError';
import Logger from '../../Logger/Logger';
import type { TDexConfig, TGetAmountOutOptions, TSwapOptions, TSwapResult } from '../../types';
import ExchangeNode from '../DexNode';
import { calculateFee, getAssetInfo, getMinAmountOut } from './utils';

class HydrationExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: BigNumber,
  ): Promise<TSwapResult> {
    const { origin, assetFrom, assetTo, slippagePct, amount } = options;

    const poolService = new PoolService(api);
    const tradeRouter = new TradeRouter(
      poolService,
      this.node === 'Basilisk' ? { includeOnly: [PoolType.XYK] } : undefined,
    );
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
      currencyFromInfo,
      currencyToInfo,
      currencyFromDecimals,
      currencyFromDecimals,
      this.node,
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
    const minAmountOut = getMinAmountOut(trade.amountOut, currencyFromDecimals, slippagePct);
    const tx: Extrinsic = await trade.toTx(minAmountOut.amount).get();

    const amountOut = trade.amountOut;

    const nativeCurrencyInfo = await getAssetInfo(tradeRouter, {
      symbol: getNativeAssetSymbol(this.node),
    });

    if (nativeCurrencyInfo === undefined) {
      throw new InvalidCurrencyError('Native currency not found');
    }

    const nativeCurrencyDecimals = getAssetDecimals(this.node, nativeCurrencyInfo.symbol);

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
    const { assetFrom, assetTo, amount, origin } = options;

    const poolService = new PoolService(api);
    const tradeRouter = new TradeRouter(
      poolService,
      this.node === 'Basilisk' ? { includeOnly: [PoolType.XYK] } : undefined,
    );
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

    const amountBN = new BigNumber(amount);
    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;
    const amountWithoutFee = amountBN.minus(amountBN.times(pctDestFee));

    const amountNormalized = amountWithoutFee.shiftedBy(-currencyFromDecimals);

    const trade = await tradeRouter.getBestSell(
      currencyFromInfo.id,
      currencyToInfo.id,
      amountNormalized,
    );

    return BigInt(trade.amountOut.toString());
  }

  async getDexConfig(api: ApiPromise): Promise<TDexConfig> {
    const poolService = new PoolService(api);
    const tradeRouter = new TradeRouter(
      poolService,
      this.node === 'Basilisk' ? { includeOnly: [PoolType.XYK] } : undefined,
    );
    const assets = await tradeRouter.getAllAssets();
    const transformedAssets = assets.map(({ symbol, id }) => {
      const sdkAssets = getAssets(this.node) as TForeignAsset[];
      const asset =
        sdkAssets.find((a) => a.assetId === id) ??
        sdkAssets.find((a) => a.symbol.toLowerCase() === symbol.toLowerCase());
      return {
        symbol,
        assetId: asset?.assetId,
        multiLocation: asset?.multiLocation,
      };
    });

    return {
      isOmni: true,
      assets: transformedAssets,
      pairs: [],
    };
  }
}

export default HydrationExchangeNode;
