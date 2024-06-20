import { getAllAssetsSymbols, getNodeProvider } from '@paraspell/sdk';
import ExchangeNode from '../DexNode';
import { type TSwapResult, type TSwapOptions, type TAssetSymbols } from '../../types';
import { createInterBtcApi, newMonetaryAmount } from 'inter-exchange';
import { type ApiPromise } from '@polkadot/api';
import { BN } from '@polkadot/util';
import BigNumber from 'bignumber.js';
import { FEE_BUFFER } from '../../consts/consts';
import Logger from '../../Logger/Logger';
import { getCurrency } from './utils';
import { SmallAmountError } from '../../errors/SmallAmountError';

class InterlayExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    { injectorAddress, currencyFrom, currencyTo, amount, slippagePct }: TSwapOptions,
    toDestTransactionFee: BigNumber,
    toExchangeTransactionFee: BigNumber,
  ): Promise<TSwapResult> {
    const interBTC = await createInterBtcApi(getNodeProvider(this.node), 'mainnet');

    const assetFrom = await getCurrency(currencyFrom, interBTC, this.node);

    if (assetFrom === null) {
      throw new Error('Currency from is invalid.');
    }

    const assetTo = await getCurrency(currencyTo, interBTC, this.node);

    if (assetTo === null) {
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

    const inputAmount = newMonetaryAmount(amountWithoutFee.toString(), assetFrom);

    const liquidityPools = await interBTC.amm.getLiquidityPools();

    const trade = interBTC.amm.getOptimalTrade(inputAmount, assetTo, liquidityPools);

    if (trade === null) {
      throw new Error('No trade found');
    }

    const outputAmount = trade.getMinimumOutputAmount(Number(slippagePct));

    const currentBlock = await api.query.system.number();
    const deadline = currentBlock.add(new BN(150));

    const trade1 = interBTC.amm.swap(trade, outputAmount, injectorAddress, deadline.toString());
    const extrinsic: any = trade1.extrinsic;

    return {
      tx: extrinsic,
      amountOut: trade.outputAmount.toString(true),
    };
  }

  async getAssetSymbols(api: ApiPromise): Promise<TAssetSymbols> {
    return getAllAssetsSymbols(this.node);
  }
}

export default InterlayExchangeNode;
