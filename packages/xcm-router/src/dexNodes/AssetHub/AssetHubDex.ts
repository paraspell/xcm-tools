import { getNativeAssetSymbol, InvalidParameterError, Parents } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import BigNumber from 'bignumber.js';

import { getExchangeAsset } from '../../assets';
import { DEST_FEE_BUFFER_PCT, FEE_BUFFER } from '../../consts';
import { SmallAmountError } from '../../errors/SmallAmountError';
import type {
  TDexConfig,
  TGetAmountOutOptions,
  TMultiSwapResult,
  TSingleSwapResult,
  TSwapOptions,
} from '../../types';
import ExchangeNode from '../DexNode';
import { getDexConfig, getQuotedAmount } from './utils';

class AssetHubExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTxFee: BigNumber,
  ): Promise<TSingleSwapResult> {
    const { assetFrom, assetTo, amount, senderAddress, slippagePct, origin } = options;

    if (!assetFrom.multiLocation) {
      throw new InvalidParameterError('Asset from multiLocation not found');
    }

    if (!assetTo.multiLocation) {
      throw new InvalidParameterError('Asset to multiLocation not found');
    }

    const amountIn = BigNumber(amount);
    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;
    const amountWithoutFee = amountIn.minus(amountIn.times(pctDestFee));

    const {
      amountOut: quotedAmountOut,
      usedFromML,
      usedToML,
    } = await getQuotedAmount(
      api,
      assetFrom.multiLocation,
      assetTo.multiLocation,
      amountWithoutFee,
    );

    const slippageMultiplier = BigNumber(1).minus(BigNumber(slippagePct).dividedBy(100));
    const minAmountOut = BigInt(
      new BigNumber(quotedAmountOut.toString()).multipliedBy(slippageMultiplier).toFixed(0),
    );

    const tx = api.tx.assetConversion.swapExactTokensForTokens(
      [usedFromML, usedToML],
      amountWithoutFee.toString(),
      minAmountOut,
      senderAddress,
      assetFrom.assetId === undefined,
    );

    const toDestFeeCurrencyTo =
      assetTo.symbol == getNativeAssetSymbol(this.node)
        ? toDestTxFee
        : await getQuotedAmount(
            api,
            {
              parents: Parents.ONE,
              interior: {
                Here: null,
              },
            },
            assetTo.multiLocation,
            toDestTxFee,
            true,
          ).then((res) => res.amountOut);

    const toDestFeeCurrencyToBN = BigNumber(toDestFeeCurrencyTo.toString());
    const quotedAmountOutBN = BigNumber(quotedAmountOut.toString());

    const finalAmountOut = quotedAmountOutBN
      .minus(toDestFeeCurrencyToBN.multipliedBy(FEE_BUFFER))
      .decimalPlaces(0);

    if (finalAmountOut.isNegative()) {
      throw new SmallAmountError(
        'The provided amount is too small to cover the fees. Please provide a larger amount.',
      );
    }

    return {
      tx,
      amountOut: finalAmountOut.toString(),
    };
  }

  async handleMultiSwap(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: BigNumber,
  ): Promise<TMultiSwapResult> {
    const { assetFrom, assetTo } = options;

    const nativeAsset = getExchangeAsset(this.node, this.exchangeNode, {
      symbol: getNativeAssetSymbol(this.node),
    });

    if (!nativeAsset) {
      throw new InvalidParameterError('Native asset not found for this exchange node.');
    }

    const isAssetFromNative = assetFrom.symbol === nativeAsset.symbol;
    const isAssetToNative = assetTo.symbol === nativeAsset.symbol;

    if (isAssetFromNative && isAssetToNative) {
      throw new InvalidParameterError('Cannot swap native asset to itself.');
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
      const resultHop1 = await this.swapCurrency(api, optionsHop1, BigNumber(0));

      if (BigNumber(resultHop1.amountOut).isLessThanOrEqualTo(0)) {
        throw new SmallAmountError(
          `First hop (${assetFrom.symbol} -> ${nativeAsset.symbol}) resulted in zero or negative output.`,
        );
      }

      const hop1Received = BigNumber(resultHop1.amountOut);
      const assumedInputForHop2 = hop1Received.multipliedBy(0.98).decimalPlaces(0);

      const optionsHop2: TSwapOptions = {
        slippagePct: options.slippagePct,
        senderAddress: options.senderAddress,
        origin: undefined,
        assetFrom: nativeAsset,
        assetTo: assetTo,
        amount: assumedInputForHop2.toString(),
        feeCalcAddress: options.feeCalcAddress,
      };

      const resultHop2 = await this.swapCurrency(api, optionsHop2, toDestTransactionFee);

      if (BigNumber(resultHop2.amountOut).isLessThanOrEqualTo(0)) {
        throw new SmallAmountError(
          `Second hop (${nativeAsset.symbol} -> ${assetTo.symbol}) resulted in zero or negative output.`,
        );
      }

      return {
        txs: [resultHop1.tx, resultHop2.tx],
        amountOut: resultHop2.amountOut,
      };
    }
  }

  async getAmountOut(api: ApiPromise, options: TGetAmountOutOptions) {
    const { assetFrom, assetTo, amount, origin } = options;

    if (!assetFrom.multiLocation) {
      throw new InvalidParameterError('Asset from multiLocation not found');
    }

    if (!assetTo.multiLocation) {
      throw new InvalidParameterError('Asset to multiLocation not found');
    }

    const amountIn = BigNumber(amount);
    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;
    const amountWithoutFee = amountIn.minus(amountIn.times(pctDestFee));

    const { amountOut } = await getQuotedAmount(
      api,
      assetFrom.multiLocation,
      assetTo.multiLocation,
      amountWithoutFee,
    );

    return amountOut;
  }

  async getDexConfig(api: ApiPromise): Promise<TDexConfig> {
    return getDexConfig(api, this.node);
  }
}

export default AssetHubExchangeNode;
