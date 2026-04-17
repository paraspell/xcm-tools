import type { PolkadotApi, TLocation } from '@paraspell/sdk-core';
import {
  AmountTooLowError,
  getNativeAssetSymbol,
  localizeLocation,
  padValueBy,
  Parents,
  RoutingResolutionError,
} from '@paraspell/sdk-core';
import type { ApiPromise } from '@polkadot/api';

import { getExchangeAsset } from '../../assets';
import { DEST_FEE_BUFFER_PCT, FEE_BUFFER_PCT } from '../../consts';
import type {
  TDexConfigStored,
  TGetAmountOutOptions,
  TMultiSwapResult,
  TSingleSwapResult,
  TSwapOptions,
} from '../../types';
import ExchangeChain from '../ExchangeChain';
import { getDexConfig } from './utils';

class AssetHubExchange extends ExchangeChain {
  private async quoteOrThrow<TApi, TRes, TSigner>(
    api: PolkadotApi<TApi, TRes, TSigner>,
    fromLocation: TLocation,
    toLocation: TLocation,
    amount: bigint,
    includeFee = true,
  ): Promise<bigint> {
    let quoted: bigint | undefined;
    let cause: unknown;

    try {
      quoted = await api.queryRuntimeApi<bigint | undefined>({
        module: 'AssetConversionApi',
        method: 'quote_price_exact_tokens_for_tokens',
        params: [fromLocation, toLocation, amount, includeFee],
      });
    } catch (err) {
      cause = err;
    }

    if (quoted == null) {
      const message = cause instanceof Error ? ` (${cause.message})` : '';
      throw new RoutingResolutionError(`Swap failed: Pool not found${message}`);
    }

    return BigInt(quoted);
  }

  async swapCurrency<TApi, TRes, TSigner>(
    options: TSwapOptions<TApi, TRes, TSigner>,
    toDestTxFee: bigint,
  ): Promise<TSingleSwapResult<TRes>> {
    const { api, assetFrom, assetTo, amount, sender, slippagePct, origin } = options;

    const localizedFrom = localizeLocation(this.chain, assetFrom.location);
    const localizedTo = localizeLocation(this.chain, assetTo.location);

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;
    const amountWithoutFee = padValueBy(amount, pctDestFee);

    const amountOut = await this.quoteOrThrow(api, localizedFrom, localizedTo, amountWithoutFee);

    const slippageMultiplier = Number(slippagePct);
    const minAmountOut = padValueBy(amountOut, -slippageMultiplier);

    const tx = api.deserializeExtrinsics({
      module: 'AssetConversion',
      method: 'swap_exact_tokens_for_tokens',
      params: {
        path: [localizedFrom, localizedTo],
        amount_in: amountWithoutFee,
        amount_out_min: minAmountOut,
        send_to: sender,
        keep_alive: !!assetFrom.isNative,
      },
    });

    const toDestFeeCurrencyTo =
      assetTo.symbol == getNativeAssetSymbol(this.chain)
        ? toDestTxFee
        : await this.quoteOrThrow(
            api,
            {
              parents: Parents.ONE,
              interior: {
                Here: null,
              },
            },
            localizedTo,
            toDestTxFee,
            true,
          );

    const finalAmountOut = amountOut - padValueBy(toDestFeeCurrencyTo, FEE_BUFFER_PCT);

    if (finalAmountOut <= 0n) throw new AmountTooLowError();

    return {
      tx,
      amountOut: finalAmountOut,
    };
  }

  async handleMultiSwap<TApi, TRes, TSigner>(
    options: TSwapOptions<TApi, TRes, TSigner>,
    toDestTransactionFee: bigint,
  ): Promise<TMultiSwapResult<TRes>> {
    const { assetFrom, assetTo } = options;

    const nativeAsset = getExchangeAsset(this.chain, {
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
      const singleSwapResult = await this.swapCurrency(options, toDestTransactionFee);
      return {
        txs: [singleSwapResult.tx],
        amountOut: singleSwapResult.amountOut,
      };
    } else {
      // Multi-hop: AssetA -> Native -> AssetB
      const optionsHop1: TSwapOptions<TApi, TRes, TSigner> = { ...options, assetTo: nativeAsset };
      const resultHop1 = await this.swapCurrency(optionsHop1, 0n);

      if (resultHop1.amountOut <= 0n) {
        throw new AmountTooLowError(
          `First hop (${assetFrom.symbol} -> ${nativeAsset.symbol}) resulted in zero or negative output.`,
        );
      }

      const hop1Received = resultHop1.amountOut;
      const assumedInputForHop2 = padValueBy(hop1Received, -2);

      const optionsHop2: TSwapOptions<TApi, TRes, TSigner> = {
        apiPjs: options.apiPjs,
        api: options.api,
        slippagePct: options.slippagePct,
        sender: options.sender,
        origin: undefined,
        assetFrom: nativeAsset,
        assetTo: assetTo,
        amount: assumedInputForHop2,
        feeCalcAddress: options.feeCalcAddress,
      };

      const resultHop2 = await this.swapCurrency(optionsHop2, toDestTransactionFee);

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

  async getAmountOut<TApi, TRes, TSigner>(options: TGetAmountOutOptions<TApi, TRes, TSigner>) {
    const { api, assetFrom, assetTo, amount, origin } = options;

    const nativeAsset = getExchangeAsset(this.chain, {
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
      return this.quoteOrThrow(
        api,
        localizeLocation(this.chain, assetFrom.location),
        localizeLocation(this.chain, assetTo.location),
        amountWithoutFee,
      );
    } else {
      const hop1AmountOut = await this.quoteOrThrow(
        api,
        localizeLocation(this.chain, assetFrom.location),
        localizeLocation(this.chain, nativeAsset.location),
        amountWithoutFee,
      );

      if (hop1AmountOut <= 0n) {
        throw new AmountTooLowError(
          `First hop (${assetFrom.symbol} -> ${nativeAsset.symbol}) resulted in zero or negative output.`,
        );
      }

      const assumedInputForHop2 = padValueBy(hop1AmountOut, -2);

      const finalAmountOut = await this.quoteOrThrow(
        api,
        localizeLocation(this.chain, nativeAsset.location),
        localizeLocation(this.chain, assetTo.location),
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

  async getDexConfig(api: ApiPromise): Promise<TDexConfigStored> {
    return getDexConfig(api, this.chain);
  }
}

export default AssetHubExchange;
