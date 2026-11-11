import type { TPapiApi } from '@paraspell/sdk';
import type { PolkadotApi, TAssetInfo, TLocation, TQueriedAmount } from '@paraspell/sdk-core';
import {
  AmountTooLowError,
  findNativeAssetInfoOrThrow,
  isAssetEqual,
  localizeLocation,
  padValueBy,
  RoutingResolutionError,
} from '@paraspell/sdk-core';

import { DEST_FEE_BUFFER_PCT, FEE_BUFFER_PCT } from '../../consts';
import type {
  TDexConfigStored,
  TGenericGetAmountOutOptions,
  TGenericSwapOptions,
  TSwapResult,
} from '../../types';
import ExchangeChain from '../ExchangeChain';
import { getDexConfig } from './utils';

class AssetHubExchange extends ExchangeChain<'GENERIC'> {
  readonly apiType = 'GENERIC';

  private async quoteOrThrow<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    fromLocation: TLocation,
    toLocation: TLocation,
    amount: bigint,
    includeFee = true,
  ): Promise<bigint> {
    let quoted: TQueriedAmount;
    let cause: unknown;

    try {
      quoted = await api.queryRuntimeApi<TQueriedAmount>({
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

  private async quoteSwapOrThrow<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    assetFrom: TAssetInfo,
    assetTo: TAssetInfo,
    nativeAsset: TAssetInfo,
    amount: bigint,
  ): Promise<{ path: TLocation[]; amountOut: bigint }> {
    if (isAssetEqual(assetFrom, assetTo)) {
      throw new RoutingResolutionError('Cannot swap asset to itself.');
    }

    const from = localizeLocation(this.chain, assetFrom.location);
    const to = localizeLocation(this.chain, assetTo.location);

    if (isAssetEqual(assetFrom, nativeAsset) || isAssetEqual(assetTo, nativeAsset)) {
      return { path: [from, to], amountOut: await this.quoteOrThrow(api, from, to, amount) };
    }

    const native = localizeLocation(this.chain, nativeAsset.location);
    const nativeAmountOut = await this.quoteOrThrow(api, from, native, amount);

    if (nativeAmountOut <= 0n) {
      throw new AmountTooLowError(
        `First hop (${assetFrom.symbol} -> ${nativeAsset.symbol}) resulted in zero or negative output.`,
      );
    }

    return {
      path: [from, native, to],
      amountOut: await this.quoteOrThrow(api, native, to, nativeAmountOut),
    };
  }

  async swapCurrency<TApi, TRes, TSigner, TCustomChain extends string = never>(
    options: TGenericSwapOptions<TApi, TRes, TSigner, TCustomChain>,
    toDestTxFee: bigint,
  ): Promise<TSwapResult<TRes>> {
    const { api, assetFrom, assetTo, amount, sender, slippagePct, origin } = options;

    const nativeAsset = findNativeAssetInfoOrThrow(this.chain);

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;
    const amountWithoutFee = padValueBy(amount, pctDestFee);

    const { path, amountOut } = await this.quoteSwapOrThrow(
      api,
      assetFrom,
      assetTo,
      nativeAsset,
      amountWithoutFee,
    );

    const slippageMultiplier = Number(slippagePct);
    const minAmountOut = padValueBy(amountOut, -slippageMultiplier);

    const tx = api.deserializeExtrinsics({
      module: 'AssetConversion',
      method: 'swap_exact_tokens_for_tokens',
      params: {
        path,
        amount_in: amountWithoutFee,
        amount_out_min: minAmountOut,
        send_to: sender,
        keep_alive: !!assetFrom.isNative,
      },
    });

    const toDestFeeCurrencyTo =
      toDestTxFee === 0n || isAssetEqual(assetTo, nativeAsset)
        ? toDestTxFee
        : await this.quoteOrThrow(
            api,
            localizeLocation(this.chain, nativeAsset.location),
            localizeLocation(this.chain, assetTo.location),
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

  async getAmountOut<TApi, TRes, TSigner, TCustomChain extends string = never>(
    options: TGenericGetAmountOutOptions<TApi, TRes, TSigner, TCustomChain>,
  ) {
    const { api, assetFrom, assetTo, amount, origin } = options;

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;
    const amountWithoutFee = padValueBy(amount, pctDestFee);

    const { amountOut } = await this.quoteSwapOrThrow(
      api,
      assetFrom,
      assetTo,
      findNativeAssetInfoOrThrow(this.chain),
      amountWithoutFee,
    );

    return amountOut;
  }

  async getDexConfig(api: TPapiApi): Promise<TDexConfigStored> {
    return getDexConfig(api, this.chain);
  }
}

export default AssetHubExchange;
