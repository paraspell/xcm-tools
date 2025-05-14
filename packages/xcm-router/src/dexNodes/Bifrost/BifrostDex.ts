import { Amount, getCurrencyCombinations, Token } from '@crypto-dex-sdk/currency';
import { Percent } from '@crypto-dex-sdk/math';
import { SwapRouter } from '@crypto-dex-sdk/parachains-bifrost';
import { getNativeAssetSymbol, getParaId } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import BigNumber from 'bignumber.js';

import { DEST_FEE_BUFFER_PCT, FEE_BUFFER } from '../../consts';
import { SmallAmountError } from '../../errors/SmallAmountError';
import Logger from '../../Logger/Logger';
import type { TDexConfig, TGetAmountOutOptions, TSwapOptions, TSwapResult } from '../../types';
import ExchangeNode from '../DexNode';
import { findToken, getBestTrade, getFilteredPairs, getTokenMap } from './utils';
import { getDexConfig } from './utils/getDexConfig';

class BifrostExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTxFee: BigNumber,
  ): Promise<TSwapResult> {
    const { assetFrom, assetTo, amount, senderAddress, slippagePct, origin } = options;

    const chainId = getParaId(this.node);

    const tokenMap = getTokenMap(this.node, chainId);

    const tokenWrappedFrom = findToken(tokenMap, assetFrom.symbol);

    if (tokenWrappedFrom === undefined) {
      throw new Error('Currency from not found');
    }

    const tokenWrappedTo = findToken(tokenMap, assetTo.symbol);

    if (tokenWrappedTo === undefined) {
      throw new Error('Currency to not found');
    }

    const tokenFrom = new Token(tokenWrappedFrom.wrapped);
    const tokenTo = new Token(tokenWrappedTo.wrapped);

    const currencyCombinations = getCurrencyCombinations(chainId, tokenFrom, tokenTo);

    const pairs = await getFilteredPairs(api, chainId, currencyCombinations);

    Logger.log('To dest tx fee in native currency:', toDestTxFee.toString());
    Logger.log('Original amount', amount);

    const amountBN = new BigNumber(amount);

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;

    const amountWithoutFee = amountBN.minus(amountBN.times(pctDestFee));
    Logger.log('Amount modified', amountWithoutFee.toString());

    if (amountWithoutFee.isNegative()) {
      throw new SmallAmountError(
        'The provided amount is too small to cover the fees. Please provide a larger amount.',
      );
    }

    const amountInFinal = Amount.fromRawAmount(tokenFrom, amountWithoutFee.toString());

    const trade = getBestTrade(chainId, pairs, amountInFinal, tokenTo);

    const allowedSlippage = new Percent(Number(slippagePct) * 100, 10_000);

    const blockNumber = await api.derive.chain.bestNumber();

    const deadline = blockNumber.toNumber() + 20;

    const { extrinsic } = SwapRouter.swapCallParameters(trade, {
      api,
      allowedSlippage,
      recipient: senderAddress,
      deadline,
    });

    if (extrinsic === null) {
      throw new Error('Extrinsic is null');
    }

    const amountOutBN = new BigNumber(trade.outputAmount.toFixed())
      .shiftedBy(tokenTo.decimals)
      .decimalPlaces(0);

    const nativeSymbol = getNativeAssetSymbol(this.node);

    if (tokenTo.symbol === nativeSymbol) {
      const amountOutWithFee = amountOutBN
        .minus(toDestTxFee)
        .multipliedBy(FEE_BUFFER)
        .decimalPlaces(0);

      if (amountOutWithFee.isNegative()) {
        throw new SmallAmountError(
          'The provided amount is too small to cover the fees. Please provide a larger amount.',
        );
      }

      Logger.log('Amount out with fee:', amountOutWithFee.toString());
      return { tx: extrinsic[0], amountOut: amountOutWithFee.toString() };
    }

    Logger.log('Calculated amount out:', amountOutBN.toString());

    return {
      tx: extrinsic[0],
      amountOut: amountOutBN.toString(),
    };
  }

  async getAmountOut(api: ApiPromise, options: TGetAmountOutOptions): Promise<bigint> {
    const { assetFrom, assetTo, amount, origin } = options;

    const chainId = getParaId(this.node);

    const tokenMap = getTokenMap(this.node, chainId);

    const tokenWrappedFrom = findToken(tokenMap, assetFrom.symbol);

    if (tokenWrappedFrom === undefined) {
      throw new Error('Currency from not found');
    }

    const tokenWrappedTo = findToken(tokenMap, assetTo.symbol);

    if (tokenWrappedTo === undefined) {
      throw new Error('Currency to not found');
    }

    const tokenFrom = new Token(tokenWrappedFrom.wrapped);
    const tokenTo = new Token(tokenWrappedTo.wrapped);

    const currencyCombinations = getCurrencyCombinations(chainId, tokenFrom, tokenTo);

    const pairs = await getFilteredPairs(api, chainId, currencyCombinations);

    const amountBN = new BigNumber(amount);

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;

    const amountWithoutFee = amountBN.minus(amountBN.times(pctDestFee));

    const amountIn = Amount.fromRawAmount(tokenFrom, amountWithoutFee.toString());
    const trade = getBestTrade(chainId, pairs, amountIn, tokenTo);

    const amountOut = trade.outputAmount.toFixed();

    return BigInt(amountOut);
  }

  async getDexConfig(api: ApiPromise): Promise<TDexConfig> {
    return getDexConfig(api, this.node);
  }
}

export default BifrostExchangeNode;
