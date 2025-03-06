import type { TForeignAsset } from '@paraspell/sdk-pjs';
import { getAssets, getNativeAssetSymbol, getNodeProviders } from '@paraspell/sdk-pjs';
import { type ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';
import BigNumber from 'bignumber.js';
import { createInterBtcApi, createSubstrateAPI, newMonetaryAmount } from 'inter-exchange';

import { DEST_FEE_BUFFER_PCT, FEE_BUFFER } from '../../consts';
import { SmallAmountError } from '../../errors/SmallAmountError';
import Logger from '../../Logger/Logger';
import type {
  TAssets,
  TGetAmountOutOptions,
  TSwapOptions,
  TSwapResult,
  TWeight,
} from '../../types';
import ExchangeNode from '../DexNode';
import { getCurrency } from './utils';

class InterlayExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: BigNumber,
    _toExchangeTxWeight: TWeight,
  ): Promise<TSwapResult> {
    const { senderAddress, assetFrom, assetTo, amount, slippagePct, origin } = options;

    const interBTC = await createInterBtcApi(getNodeProviders(this.node)[0], 'mainnet');

    const assetFromInfo = await getCurrency(interBTC, assetFrom);

    if (assetFromInfo === null) {
      throw new Error('Currency from is invalid.');
    }

    const assetToInfo = await getCurrency(interBTC, assetTo);

    if (assetToInfo === null) {
      throw new Error('Currency to is invalid.');
    }

    const amountBN = new BigNumber(amount);

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;

    const amountWithoutFee = amountBN.minus(amountBN.times(pctDestFee));

    if (amountWithoutFee.isNegative()) {
      throw new SmallAmountError(
        'The provided amount is too small to cover the exchange fees. Please provide a larger amount.',
      );
    }

    Logger.log('Original amount', amount);
    Logger.log('Amount without fee', amountWithoutFee.toString());

    const inputAmount = newMonetaryAmount(amountWithoutFee.toString(), assetFromInfo);

    const liquidityPools = await interBTC.amm.getLiquidityPools();

    const trade = interBTC.amm.getOptimalTrade(inputAmount, assetToInfo, liquidityPools);

    if (trade === null) {
      throw new Error('No trade found');
    }

    const outputAmount = trade.getMinimumOutputAmount(Number(slippagePct));

    const currentBlock = await api.query.system.number();
    const currentBlockNumber = new BN(currentBlock.toString());
    const deadline = currentBlockNumber.add(new BN(150));

    const trade1 = interBTC.amm.swap(trade, outputAmount, senderAddress, deadline.toString());
    const tx = trade1.extrinsic;

    const amountOutBN = BigNumber(trade.outputAmount.toString(true));

    const nativeSymbol = getNativeAssetSymbol(this.node);
    if (assetTo.symbol === nativeSymbol) {
      const amountOutWithFee = amountOutBN
        .minus(toDestTransactionFee)
        .multipliedBy(FEE_BUFFER)
        .decimalPlaces(0);
      Logger.log('Amount out with fee:', amountOutWithFee.toString());
      return { tx, amountOut: amountOutWithFee.toString() };
    }

    return {
      tx,
      amountOut: trade.outputAmount.toString(true),
    };
  }

  async getAmountOut(_api: ApiPromise, options: TGetAmountOutOptions) {
    const { assetFrom, assetTo, amount } = options;

    const interBTC = await createInterBtcApi(getNodeProviders(this.node)[0], 'mainnet');

    const assetFromInfo = await getCurrency(interBTC, assetFrom);

    if (assetFromInfo === null) {
      throw new Error('Currency from is invalid.');
    }

    const assetToInfo = await getCurrency(interBTC, assetTo);

    if (assetToInfo === null) {
      throw new Error('Currency to is invalid.');
    }

    const amountBN = new BigNumber(amount);

    const inputAmount = newMonetaryAmount(amountBN.toString(), assetFromInfo);

    const liquidityPools = await interBTC.amm.getLiquidityPools();

    const trade = interBTC.amm.getOptimalTrade(inputAmount, assetToInfo, liquidityPools);

    if (trade === null) {
      throw new Error('No trade found');
    }

    const outputAmount = trade.outputAmount;

    return BigInt(outputAmount.toString(true));
  }

  async getAssets(_api: ApiPromise): Promise<TAssets> {
    const assets = getAssets(this.node) as TForeignAsset[];
    const transformedAssets = assets.map((asset) => ({
      symbol: asset.symbol ?? '',
      id: asset.assetId,
    }));
    return Promise.resolve(transformedAssets);
  }

  async createApiInstance(): Promise<ApiPromise> {
    return createSubstrateAPI(getNodeProviders(this.node)[0]);
  }
}

export default InterlayExchangeNode;
