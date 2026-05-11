import { createSdkContext } from '@galacticcouncil/sdk-next';
import type { TPapiApi } from '@paraspell/sdk';
import type { TAssetInfo } from '@paraspell/sdk-core';
import {
  AmountTooLowError,
  findNativeAssetInfoOrThrow,
  formatUnits,
  getAssets,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  padValueBy,
  UnableToComputeError,
} from '@paraspell/sdk-core';
import { parseUnits } from 'ethers-v6';

import { DEST_FEE_BUFFER_PCT, FEE_BUFFER_PCT } from '../../consts';
import Logger from '../../Logger/Logger';
import type {
  TDexConfigStored,
  TPapiGetAmountOutOptions,
  TPapiSwapOptions,
  TSingleSwapResult,
} from '../../types';
import { pow10n } from '../../utils';
import ExchangeChain from '../ExchangeChain';
import { calculateFee, getAssetInfo } from './utils';

class HydrationExchange extends ExchangeChain<'PAPI'> {
  readonly apiType = 'PAPI';

  async swapCurrency<TApi, TRes, TSigner>(
    options: TPapiSwapOptions<TApi, TRes, TSigner>,
    toDestTransactionFee: bigint,
  ): Promise<TSingleSwapResult<TRes>> {
    const { apiPapi, origin, assetFrom, assetTo, sender, slippagePct, amount } = options;

    const {
      api: { router: tradeRouter },
      client: { asset: assetClient },
      tx: txBuilderFactory,
    } = await createSdkContext(apiPapi);

    const currencyFromInfo = await getAssetInfo(assetClient, assetFrom);
    const currencyToInfo = await getAssetInfo(assetClient, assetTo);

    if (currencyFromInfo === undefined) {
      throw new InvalidCurrencyError("Currency from doesn't exist");
    } else if (currencyToInfo === undefined) {
      throw new InvalidCurrencyError("Currency to doesn't exist");
    }

    const tradeFee = await calculateFee(
      options,
      tradeRouter,
      txBuilderFactory,
      assetClient,
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
      .withBeneficiary(sender)
      .build();

    const tx = substrateTx.get();

    const amountOut = trade.amountOut;

    const nativeCurrencyInfo = await getAssetInfo(assetClient, {
      symbol: getNativeAssetSymbol(this.chain),
    });

    if (nativeCurrencyInfo === undefined) {
      throw new InvalidCurrencyError('Native currency not found');
    }

    const { decimals: nativeCurrencyDecimals } = findNativeAssetInfoOrThrow(this.chain);

    let priceInfo = await tradeRouter.getSpotPrice(currencyToInfo.id, nativeCurrencyInfo.id);

    if (currencyToInfo.id === nativeCurrencyInfo.id) {
      priceInfo = {
        amount: parseUnits('1', nativeCurrencyDecimals),
        decimals: nativeCurrencyDecimals,
      };
    }

    if (priceInfo === undefined) {
      throw new UnableToComputeError('Price not found');
    }

    const currencyToPrice = priceInfo.amount;

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

  async getAmountOut<TApi, TRes, TSigner>(
    options: TPapiGetAmountOutOptions<TApi, TRes, TSigner>,
  ): Promise<bigint> {
    const { apiPapi, assetFrom, assetTo, amount, origin, slippagePct = '0' } = options;

    const {
      api: { router: tradeRouter },
      client: { asset: assetClient },
    } = await createSdkContext(apiPapi);

    const currencyFromInfo = await getAssetInfo(assetClient, assetFrom);
    const currencyToInfo = await getAssetInfo(assetClient, assetTo);

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

    const amountOut = trade.amountOut;

    const slippageMultiplier = Number(slippagePct);

    return padValueBy(amountOut, -slippageMultiplier);
  }

  async getDexConfig(api: TPapiApi): Promise<TDexConfigStored> {
    const sdk = await createSdkContext(api);

    try {
      const assets = await sdk.client.asset.getSupported();
      const sdkAssets = getAssets(this.chain);

      const transformedAssets: TAssetInfo[] = assets
        .map(({ symbol, id }) => {
          const asset =
            sdkAssets.find((a) => !a.isNative && a.assetId === id.toString()) ??
            sdkAssets.find((a) => a.symbol.toLowerCase() === symbol.toLowerCase());

          if (!asset) return null;

          return asset;
        })
        .filter((asset) => asset !== null);

      return {
        isOmni: true,
        assets: transformedAssets.map((asset) => asset.location),
        pairs: [],
      };
    } finally {
      sdk.destroy();
    }
  }
}

export default HydrationExchange;
