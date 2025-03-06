import type { TForeignAsset, TMultiLocation } from '@paraspell/sdk-pjs';
import { getAssets, getNativeAssetSymbol, Parents } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import BigNumber from 'bignumber.js';

import { DEST_FEE_BUFFER_PCT, FEE_BUFFER } from '../../consts';
import type { TAssets, TGetAmountOutOptions, TSwapOptions, TSwapResult } from '../../types';
import ExchangeNode from '../DexNode';
import { getQuotedAmount } from './utils';

class AssetHubExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTxFee: BigNumber,
  ): Promise<TSwapResult> {
    const { assetFrom, assetTo, amount, senderAddress, slippagePct, origin } = options;

    if (!assetFrom.multiLocation) {
      throw new Error('Asset from multiLocation not found');
    }

    if (!assetTo.multiLocation) {
      throw new Error('Asset to multiLocation not found');
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
      assetFrom.multiLocation as TMultiLocation,
      assetTo.multiLocation as TMultiLocation,
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
      assetFrom.id === undefined,
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
            assetTo.multiLocation as TMultiLocation,
            toDestTxFee,
            true,
          ).then((res) => res.amountOut);

    const toDestFeeCurrencyToBN = BigNumber(toDestFeeCurrencyTo.toString());
    const quotedAmountOutBN = BigNumber(quotedAmountOut.toString());

    const finalAmountOut = quotedAmountOutBN
      .minus(toDestFeeCurrencyToBN.multipliedBy(FEE_BUFFER))
      .decimalPlaces(0);

    return {
      tx,
      amountOut: finalAmountOut.toString(),
    };
  }

  async getAmountOut(api: ApiPromise, options: TGetAmountOutOptions) {
    const { assetFrom, assetTo, amount, origin } = options;

    if (!assetFrom.multiLocation) {
      throw new Error('Asset from multiLocation not found');
    }

    if (!assetTo.multiLocation) {
      throw new Error('Asset to multiLocation not found');
    }

    const amountIn = BigNumber(amount);
    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;
    const amountWithoutFee = amountIn.minus(amountIn.times(pctDestFee));

    const { amountOut } = await getQuotedAmount(
      api,
      assetFrom.multiLocation as TMultiLocation,
      assetTo.multiLocation as TMultiLocation,
      amountWithoutFee,
    );

    return amountOut;
  }

  async getAssets(_api: ApiPromise): Promise<TAssets> {
    const assets = getAssets(this.node) as TForeignAsset[];
    const transformedAssets = assets.map((asset) => ({
      symbol: asset.symbol ?? '',
      id: asset.assetId,
    }));
    return Promise.resolve(transformedAssets);
  }
}

export default AssetHubExchangeNode;
