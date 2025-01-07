import ExchangeNode from '../DexNode';
import type { TSwapResult, TSwapOptions, TAssets } from '../../types';
import type { ApiPromise } from '@polkadot/api';
import { getParaId } from '@paraspell/sdk-pjs';
import { convertAmount, findToken, getBestTrade, getFilteredPairs, getTokenMap } from './utils';
import { Amount, Token, getCurrencyCombinations } from '@crypto-dex-sdk/currency';
import { SwapRouter } from '@crypto-dex-sdk/parachains-bifrost';
import { Percent } from '@crypto-dex-sdk/math';
import BigNumber from 'bignumber.js';
import { FEE_BUFFER } from '../../consts';
import Logger from '../../Logger/Logger';
import { SmallAmountError } from '../../errors/SmallAmountError';

class BifrostExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    {
      assetFrom,
      assetTo,
      currencyFrom,
      currencyTo,
      amount,
      injectorAddress,
      slippagePct,
    }: TSwapOptions,
    toDestTransactionFee: BigNumber,
  ): Promise<TSwapResult> {
    const chainId = getParaId(this.node);

    const tokenMap = getTokenMap(this.node, chainId);

    const tokenWrappedFrom = findToken(
      tokenMap,
      assetFrom?.symbol ?? ('symbol' in currencyFrom ? currencyFrom.symbol : ''),
    );

    if (tokenWrappedFrom === undefined) {
      throw new Error('Currency from not found');
    }

    const tokenWrappedTo = findToken(
      tokenMap,
      assetTo?.symbol ?? ('symbol' in currencyTo ? currencyTo.symbol : ''),
    );

    if (tokenWrappedTo === undefined) {
      throw new Error('Currency to not found');
    }

    const tokenFrom = new Token(tokenWrappedFrom.wrapped);
    const tokenTo = new Token(tokenWrappedTo.wrapped);

    const currencyCombinations = getCurrencyCombinations(chainId, tokenFrom, tokenTo);

    const pairs = await getFilteredPairs(api, chainId, currencyCombinations);

    const toDestFee = convertAmount(toDestTransactionFee, tokenFrom, chainId, pairs);

    Logger.log('Fee in bnc', toDestFee.toString());

    Logger.log('Original amount', amount);

    const amountBN = new BigNumber(amount);

    const amountWithoutFee = amountBN.minus(toDestFee.multipliedBy(FEE_BUFFER)).decimalPlaces(0);

    if (amountWithoutFee.isNegative()) {
      throw new SmallAmountError(
        'The provided amount is too small to cover the fees. Please provide a larger amount.',
      );
    }

    Logger.log('Amount modified', amountWithoutFee.toString());

    const amountIn = Amount.fromRawAmount(tokenFrom, amountWithoutFee.toString());

    const tradeForSwapFee = getBestTrade(chainId, pairs, amountIn, tokenTo);

    const swapFeePct = tradeForSwapFee.descriptions.reduce((sum, item) => sum + item.fee, 0);

    const swapFeePctWithBuffer = swapFeePct * FEE_BUFFER;

    const amountWithoutSwapFee = amountWithoutFee
      .multipliedBy(1 - swapFeePctWithBuffer / 100)
      .decimalPlaces(0);

    if (amountWithoutSwapFee.isNegative()) {
      throw new SmallAmountError(
        'The provided amount is too small to cover the swap fees. Please provide a larger amount.',
      );
    }

    Logger.log('feePct', swapFeePct);
    Logger.log('amount without swap fee', amountWithoutSwapFee.toString());

    const amountInFinal = Amount.fromRawAmount(tokenFrom, amountWithoutSwapFee.toString());

    const trade = getBestTrade(chainId, pairs, amountInFinal, tokenTo);

    const allowedSlippage = new Percent(Number(slippagePct) * 100, 10_000);

    const blockNumber = await api.derive.chain.bestNumber();

    const deadline = blockNumber.toNumber() + 20;

    const { extrinsic } = SwapRouter.swapCallParameters(trade, {
      api,
      allowedSlippage,
      recipient: injectorAddress,
      deadline,
    });

    if (extrinsic === null) {
      throw new Error('Extrinsic is null');
    }

    const amountOutBN = new BigNumber(trade.outputAmount.toFixed())
      .shiftedBy(tokenTo.decimals)
      .decimalPlaces(0);

    const toDestFeeOut = convertAmount(toDestTransactionFee, tokenTo, chainId, pairs);

    Logger.log('out fee in bnc', toDestFeeOut.toString());

    const amountOutFinalBN = amountOutBN
      .minus(toDestFeeOut.multipliedBy(FEE_BUFFER))
      .decimalPlaces(0);

    if (amountOutFinalBN.isNegative()) {
      throw new SmallAmountError(
        'The amount after deducting fees is negative. Please provide a larger amount.',
      );
    }

    Logger.log(trade.outputAmount.toFixed().toString());
    Logger.log(amountOutBN.toString());
    Logger.log(amountOutFinalBN.toString());

    return {
      tx: extrinsic[0],
      amountOut: amountOutFinalBN.toString(),
    };
  }

  async getAssets(_api: ApiPromise): Promise<TAssets> {
    const chainId = getParaId(this.node);
    const tokenMap = getTokenMap(this.node, chainId);
    const assets = Object.values(tokenMap).map((item) => ({ symbol: item.wrapped.symbol ?? '' }));
    return Promise.resolve(assets);
  }
}

export default BifrostExchangeNode;
