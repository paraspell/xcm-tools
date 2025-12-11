import {
  AmountTooLowError,
  getNativeAssetSymbol,
  padValueBy,
  Parents,
  RoutingResolutionError,
  transform,
} from '@paraspell/sdk';
import type { ApiPromise } from '@polkadot/api';

import { getExchangeAsset } from '../../assets';
import { DEST_FEE_BUFFER_PCT, FEE_BUFFER_PCT } from '../../consts';
import type {
  TDexConfig,
  TGetAmountOutOptions,
  TMultiSwapResult,
  TSingleSwapResult,
  TSwapOptions,
} from '../../types';
import ExchangeChain from '../ExchangeChain';
import { getDexConfig, getQuotedAmount } from './utils';

class AssetHubExchange extends ExchangeChain {
  async swapCurrency(
    _api: ApiPromise,
    options: TSwapOptions,
    toDestTxFee: bigint,
  ): Promise<TSingleSwapResult> {
    const { assetFrom, assetTo, amount, senderAddress, slippagePct, origin, papiApi } = options;

    if (!assetFrom.location) {
      throw new RoutingResolutionError('Asset from location not found');
    }

    if (!assetTo.location) {
      throw new RoutingResolutionError('Asset to location not found');
    }

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;
    const amountWithoutFee = padValueBy(amount, pctDestFee);

    const { amountOut, usedFromML, usedToML } = await getQuotedAmount(
      papiApi,
      this.chain,
      assetFrom.location,
      assetTo.location,
      amountWithoutFee,
    );

    const slippageMultiplier = Number(slippagePct);

    const minAmountOut = padValueBy(amountOut, -slippageMultiplier);

    const tx = papiApi.getUnsafeApi().tx.AssetConversion.swap_exact_tokens_for_tokens({
      path: [transform(usedFromML), transform(usedToML)],
      amount_in: amountWithoutFee,
      amount_out_min: minAmountOut,
      send_to: senderAddress,
      keep_alive: assetFrom.assetId === undefined,
    });

    const toDestFeeCurrencyTo =
      assetTo.symbol == getNativeAssetSymbol(this.chain)
        ? toDestTxFee
        : await getQuotedAmount(
            papiApi,
            this.chain,
            {
              parents: Parents.ONE,
              interior: {
                Here: null,
              },
            },
            assetTo.location,
            toDestTxFee,
            true,
          ).then((res) => res.amountOut);

    const finalAmountOut = amountOut - padValueBy(toDestFeeCurrencyTo, FEE_BUFFER_PCT);

    if (finalAmountOut <= 0n) throw new AmountTooLowError();

    return {
      tx,
      amountOut: finalAmountOut,
    };
  }

  async handleMultiSwap(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: bigint,
  ): Promise<TMultiSwapResult> {
    const { assetFrom, assetTo } = options;

    const nativeAsset = getExchangeAsset(this.exchangeChain, {
      symbol: getNativeAssetSymbol(this.chain),
    });

    if (!nativeAsset) {
      throw new RoutingResolutionError('Native asset not found for this exchange chain.');
    }

    const isAssetFromNative = assetFrom.symbol === nativeAsset.symbol;
    const isAssetToNative = assetTo.symbol === nativeAsset.symbol;

    if (isAssetFromNative && isAssetToNative) {
      throw new RoutingResolutionError('Cannot swap native asset to itself.');
    }

    if (isAssetFromNative || isAssetToNative) {
      // Single hop
      const singleSwapResult = await this.swapCurrency(api, { ...options }, toDestTransactionFee);
      return {
        txs: [singleSwapResult.tx],
        amountOut: singleSwapResult.amountOut,
      };
    } else {
      // Multi-hop: AssetA -> Native -> AssetB
      const optionsHop1: TSwapOptions = { ...options, assetTo: nativeAsset };
      const resultHop1 = await this.swapCurrency(api, optionsHop1, 0n);

      if (resultHop1.amountOut <= 0n) {
        throw new AmountTooLowError(
          `First hop (${assetFrom.symbol} -> ${nativeAsset.symbol}) resulted in zero or negative output.`,
        );
      }

      const hop1Received = resultHop1.amountOut;
      const assumedInputForHop2 = padValueBy(hop1Received, -2);

      const optionsHop2: TSwapOptions = {
        papiApi: options.papiApi,
        slippagePct: options.slippagePct,
        senderAddress: options.senderAddress,
        origin: undefined,
        assetFrom: nativeAsset,
        assetTo: assetTo,
        amount: assumedInputForHop2,
        feeCalcAddress: options.feeCalcAddress,
      };

      const resultHop2 = await this.swapCurrency(api, optionsHop2, toDestTransactionFee);

      if (resultHop2.amountOut <= 0n) {
        throw new AmountTooLowError(
          `Second hop (${nativeAsset.symbol} -> ${assetTo.symbol}) resulted in zero or negative output.`,
        );
      }

      return {
        txs: [resultHop1.tx, resultHop2.tx],
        amountOut: resultHop2.amountOut,
      };
    }
  }

  async getAmountOut(_api: ApiPromise, options: TGetAmountOutOptions) {
    const { assetFrom, assetTo, amount, origin, papiApi } = options;

    if (!assetFrom.location) {
      throw new RoutingResolutionError('Asset from location not found');
    }

    if (!assetTo.location) {
      throw new RoutingResolutionError('Asset to location not found');
    }

    const nativeAsset = getExchangeAsset(this.exchangeChain, {
      symbol: getNativeAssetSymbol(this.chain),
    });

    if (!nativeAsset) {
      throw new RoutingResolutionError('Native asset not found for this exchange chain.');
    }

    const isAssetFromNative = assetFrom.symbol === nativeAsset.symbol;
    const isAssetToNative = assetTo.symbol === nativeAsset.symbol;

    if (isAssetFromNative && isAssetToNative) {
      throw new RoutingResolutionError('Cannot swap native asset to itself.');
    }

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;
    const amountWithoutFee = padValueBy(amount, pctDestFee);

    if (isAssetFromNative || isAssetToNative) {
      const { amountOut } = await getQuotedAmount(
        papiApi,
        this.chain,
        assetFrom.location,
        assetTo.location,
        amountWithoutFee,
      );

      return amountOut;
    } else {
      if (!nativeAsset.location) {
        throw new RoutingResolutionError('Native asset location not found');
      }

      const { amountOut: hop1AmountOut } = await getQuotedAmount(
        papiApi,
        this.chain,
        assetFrom.location,
        nativeAsset.location,
        amountWithoutFee,
      );

      if (hop1AmountOut <= 0n) {
        throw new AmountTooLowError(
          `First hop (${assetFrom.symbol} -> ${nativeAsset.symbol}) resulted in zero or negative output.`,
        );
      }

      const assumedInputForHop2 = padValueBy(hop1AmountOut, -2);

      const { amountOut: finalAmountOut } = await getQuotedAmount(
        papiApi,
        this.chain,
        nativeAsset.location,
        assetTo.location,
        assumedInputForHop2,
      );

      if (finalAmountOut <= 0n) {
        throw new AmountTooLowError(
          `Second hop (${nativeAsset.symbol} -> ${assetTo.symbol}) resulted in zero or negative output.`,
        );
      }

      return finalAmountOut;
    }
  }

  async getDexConfig(api: ApiPromise): Promise<TDexConfig> {
    return getDexConfig(api, this.chain);
  }
}

export default AssetHubExchange;
