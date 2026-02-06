import { BigNumber, createSdkContext } from '@galacticcouncil/sdk';
import type { TAssetInfo } from '@paraspell/sdk';
import {
  AmountTooLowError,
  formatUnits,
  getAssetDecimals,
  getAssets,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  padValueBy,
  UnableToComputeError,
} from '@paraspell/sdk';
import type { ApiPromise } from '@polkadot/api';
import { parseUnits } from 'ethers-v6';

import { DEST_FEE_BUFFER_PCT, FEE_BUFFER_PCT } from '../../consts';
import Logger from '../../Logger/Logger';
import type {
  TDexConfig,
  TGetAmountOutOptions,
  TSingleSwapResult,
  TSwapOptions,
} from '../../types';
import { pow10n } from '../../utils';
import ExchangeChain from '../ExchangeChain';
import { calculateFee, getAssetInfo } from './utils';

class HydrationExchange extends ExchangeChain {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: bigint,
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

    const tradeFee = await calculateFee(
      options,
      tradeRouter,
      txBuilderFactory,
      currencyFromInfo,
      currencyToInfo,
      currencyFromInfo.decimals,
      this.chain,
      toDestTransactionFee,
    );
    const amountWithoutFee = origin ? amount - tradeFee : amount;

    if (amountWithoutFee <= 0n) throw new AmountTooLowError();

    const amountNormalized = formatUnits(amountWithoutFee, currencyFromInfo.decimals);

    Logger.log('Original amount', amount);
    Logger.log('Amount modified', amountWithoutFee);

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

    const amountOut = BigInt(trade.amountOut.decimalPlaces(0).toString());

    const nativeCurrencyInfo = await getAssetInfo(tradeRouter, {
      symbol: getNativeAssetSymbol(this.chain),
    });

    if (nativeCurrencyInfo === undefined) {
      throw new InvalidCurrencyError('Native currency not found');
    }

    const nativeCurrencyDecimals = getAssetDecimals(this.chain, nativeCurrencyInfo.symbol);

    if (nativeCurrencyDecimals === null) {
      throw new UnableToComputeError('Native currency decimals not found');
    }

    let priceInfo = await tradeRouter.getBestSpotPrice(currencyToInfo.id, nativeCurrencyInfo.id);

    if (currencyToInfo.id === nativeCurrencyInfo.id) {
      priceInfo = {
        amount: BigNumber(parseUnits('1', nativeCurrencyDecimals)),
        decimals: nativeCurrencyDecimals,
      };
    }

    if (priceInfo === undefined) {
      throw new UnableToComputeError('Price not found');
    }

    const currencyToPrice = BigInt(priceInfo.amount.decimalPlaces(0).toString());

    const feeInCurrencyTo =
      (toDestTransactionFee *
        pow10n(priceInfo.decimals + currencyToInfo.decimals) *
        BigInt(FEE_BUFFER_PCT)) /
      (currencyToPrice * pow10n(nativeCurrencyDecimals) * 100n);

    Logger.log('Amount out fee', feeInCurrencyTo, nativeCurrencyInfo.symbol);

    const amountOutModified = amountOut - feeInCurrencyTo;

    if (amountOutModified <= 0n) throw new AmountTooLowError();

    Logger.log('Amount out original', amountOut);
    Logger.log('Amount out modified', amountOutModified);

    return { tx, amountOut: amountOutModified };
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

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;
    const amountWithoutFee = padValueBy(amount, pctDestFee);

    const amountNormalized = formatUnits(amountWithoutFee, currencyFromInfo.decimals);

    const trade = await tradeRouter.getBestSell(
      currencyFromInfo.id,
      currencyToInfo.id,
      amountNormalized,
    );

    const amountOut = BigInt(trade.amountOut.decimalPlaces(0).toString());

    const slippageMultiplier = Number(slippagePct);

    return padValueBy(amountOut, -slippageMultiplier);
  }

  async getDexConfig(api: ApiPromise): Promise<TDexConfig> {
    const {
      api: { router: tradeRouter },
    } = createSdkContext(api);

    const assets = await tradeRouter.getAllAssets();

    const sdkAssets = getAssets(this.chain);

    const transformedAssets: TAssetInfo[] = assets
      .map(({ symbol, id, decimals }) => {
        const asset =
          sdkAssets.find((a) => !a.isNative && a.assetId === id) ??
          sdkAssets.find((a) => a.symbol.toLowerCase() === symbol.toLowerCase());

        if (!asset?.location) return null;

        return {
          symbol,
          decimals,
          assetId: asset.isNative ? undefined : asset.assetId,
          location: asset.location,
        };
      })
      .filter((asset) => asset !== null);

    return {
      isOmni: true,
      assets: transformedAssets,
      pairs: [],
    };
  }
}

export default HydrationExchange;
