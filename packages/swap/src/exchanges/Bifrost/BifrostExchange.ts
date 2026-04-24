import { Amount, getCurrencyCombinations, Token } from '@crypto-dex-sdk/currency';
import { Percent } from '@crypto-dex-sdk/math';
import { SwapRouter } from '@crypto-dex-sdk/parachains-bifrost';
import {
  AmountTooLowError,
  getNativeAssetSymbol,
  getParaId,
  padValueBy,
  parseUnits,
  RoutingResolutionError,
} from '@paraspell/sdk-core';
import type { ApiPromise } from '@polkadot/api';

import { DEST_FEE_BUFFER_PCT, FEE_BUFFER_PCT } from '../../consts';
import Logger from '../../Logger/Logger';
import type {
  TDexConfigStored,
  TGetAmountOutOptions,
  TSingleSwapResult,
  TSwapOptions,
} from '../../types';
import ExchangeChain from '../ExchangeChain';
import { findToken, getBestTrade, getFilteredPairs, getTokenMap } from './utils';
import { getDexConfig } from './utils/getDexConfig';

class BifrostExchange extends ExchangeChain {
  async swapCurrency<TApi, TRes, TSigner>(
    options: TSwapOptions<TApi, TRes, TSigner>,
    toDestTxFee: bigint,
  ): Promise<TSingleSwapResult<TRes>> {
    const { apiPjs, assetFrom, assetTo, amount, sender, slippagePct, origin } = options;

    const chainId = getParaId(this.chain);

    const tokenMap = getTokenMap(this.chain, chainId);

    const tokenWrappedFrom = findToken(tokenMap, assetFrom.symbol);

    if (tokenWrappedFrom === undefined) {
      throw new RoutingResolutionError('Currency from not found');
    }

    const tokenWrappedTo = findToken(tokenMap, assetTo.symbol);

    if (tokenWrappedTo === undefined) {
      throw new RoutingResolutionError('Currency to not found');
    }

    const tokenFrom = new Token(tokenWrappedFrom.wrapped);
    const tokenTo = new Token(tokenWrappedTo.wrapped);

    const currencyCombinations = getCurrencyCombinations(chainId, tokenFrom, tokenTo);

    const pairs = await getFilteredPairs(apiPjs, chainId, currencyCombinations);

    Logger.log('To dest tx fee in native currency:', toDestTxFee);
    Logger.log('Original amount', amount);

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;

    const amountWithoutFee = padValueBy(amount, pctDestFee);
    Logger.log('Amount modified', amountWithoutFee);

    if (amountWithoutFee <= 0n) throw new AmountTooLowError();

    const amountInFinal = Amount.fromRawAmount(tokenFrom, amountWithoutFee.toString());

    const trade = getBestTrade(chainId, pairs, amountInFinal, tokenTo);

    const allowedSlippage = new Percent(Number(slippagePct) * 100, 10_000);

    const blockNumber = await apiPjs.derive.chain.bestNumber();

    const deadline = blockNumber.toNumber() + 20;

    const { extrinsic } = SwapRouter.swapCallParameters(trade, {
      api: apiPjs,
      allowedSlippage,
      recipient: sender,
      deadline,
    });

    if (extrinsic === null) {
      throw new RoutingResolutionError('Extrinsic is null');
    }

    const amountOut = parseUnits(trade.outputAmount.toFixed(), tokenTo.decimals);

    const nativeSymbol = getNativeAssetSymbol(this.chain);

    if (tokenTo.symbol === nativeSymbol) {
      const amountOutWithFee = amountOut - padValueBy(toDestTxFee, FEE_BUFFER_PCT);

      if (amountOutWithFee <= 0n) throw new AmountTooLowError();

      Logger.log('Amount out with fee:', amountOutWithFee);
      return { tx: extrinsic[0], amountOut: amountOutWithFee };
    }

    Logger.log('Calculated amount out:', amountOut);

    return {
      tx: extrinsic[0],
      amountOut,
    };
  }

  async getAmountOut<TApi, TRes, TSigner>(
    options: TGetAmountOutOptions<TApi, TRes, TSigner>,
  ): Promise<bigint> {
    const { apiPjs, assetFrom, assetTo, amount, origin } = options;

    const chainId = getParaId(this.chain);

    const tokenMap = getTokenMap(this.chain, chainId);

    const tokenWrappedFrom = findToken(tokenMap, assetFrom.symbol);

    if (tokenWrappedFrom === undefined) {
      throw new RoutingResolutionError('Currency from not found');
    }

    const tokenWrappedTo = findToken(tokenMap, assetTo.symbol);

    if (tokenWrappedTo === undefined) {
      throw new RoutingResolutionError('Currency to not found');
    }

    const tokenFrom = new Token(tokenWrappedFrom.wrapped);
    const tokenTo = new Token(tokenWrappedTo.wrapped);

    const currencyCombinations = getCurrencyCombinations(chainId, tokenFrom, tokenTo);

    const pairs = await getFilteredPairs(apiPjs, chainId, currencyCombinations);

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;

    const amountWithoutFee = padValueBy(amount, pctDestFee);

    const amountIn = Amount.fromRawAmount(tokenFrom, amountWithoutFee.toString());
    const trade = getBestTrade(chainId, pairs, amountIn, tokenTo);

    return parseUnits(trade.outputAmount.toFixed(), tokenTo.decimals);
  }

  async getDexConfig(api: ApiPromise): Promise<TDexConfigStored> {
    return getDexConfig(api, this.chain);
  }
}

export default BifrostExchange;
