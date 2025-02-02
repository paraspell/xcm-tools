import type { TForeignAsset } from '@paraspell/sdk-pjs';
import { getAssets, getNodeProviders } from '@paraspell/sdk-pjs';
import ExchangeNode from '../DexNode';
import type { TSwapResult, TSwapOptions, TAssets } from '../../types';
import { createInterBtcApi, createSubstrateAPI, newMonetaryAmount } from 'inter-exchange';
import { type ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';
import BigNumber from 'bignumber.js';
import { FEE_BUFFER } from '../../consts';
import Logger from '../../Logger/Logger';
import { getCurrency } from './utils';
import { SmallAmountError } from '../../errors/SmallAmountError';

class InterlayExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    { senderAddress, assetFrom, assetTo, amount, slippagePct }: TSwapOptions,
    _toDestTransactionFee: BigNumber,
    toExchangeTransactionFee: BigNumber,
  ): Promise<TSwapResult> {
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

    const toExchangeFeeWithBuffer = toExchangeTransactionFee.multipliedBy(FEE_BUFFER);

    const amountWithoutFee = amountBN.minus(toExchangeFeeWithBuffer);

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
    const extrinsic = trade1.extrinsic;

    return {
      tx: extrinsic,
      amountOut: trade.outputAmount.toString(true),
    };
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
