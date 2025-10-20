import { Amount, getCurrencyCombinations, Token } from '@crypto-dex-sdk/currency';
import { Percent } from '@crypto-dex-sdk/math';
import { SwapRouter } from '@crypto-dex-sdk/parachains-bifrost';
import {
  AmountTooLowError,
  getNativeAssetSymbol,
  getParaId,
  InvalidParameterError,
  padValueBy,
  parseUnits,
} from '@paraspell/sdk';
import type { ApiPromise } from '@polkadot/api';

import { DEST_FEE_BUFFER_PCT, FEE_BUFFER_PCT } from '../../consts';
import Logger from '../../Logger/Logger';
import type {
  TDexConfig,
  TGetAmountOutOptions,
  TSingleSwapResult,
  TSwapOptions,
} from '../../types';
import ExchangeChain from '../ExchangeChain';
import { findToken, getBestTrade, getFilteredPairs, getTokenMap } from './utils';
import { getDexConfig } from './utils/getDexConfig';

class BifrostExchange extends ExchangeChain {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTxFee: bigint,
  ): Promise<TSingleSwapResult> {
    const { assetFrom, assetTo, amount, senderAddress, slippagePct, origin } = options;

    const chainId = getParaId(this.chain);

    const tokenMap = getTokenMap(this.chain, chainId);

    const tokenWrappedFrom = findToken(tokenMap, assetFrom.symbol);

    if (tokenWrappedFrom === undefined) {
      throw new InvalidParameterError('Currency from not found');
    }

    const tokenWrappedTo = findToken(tokenMap, assetTo.symbol);

    if (tokenWrappedTo === undefined) {
      throw new InvalidParameterError('Currency to not found');
    }

    const tokenFrom = new Token(tokenWrappedFrom.wrapped);
    const tokenTo = new Token(tokenWrappedTo.wrapped);

    const currencyCombinations = getCurrencyCombinations(chainId, tokenFrom, tokenTo);

    const pairs = await getFilteredPairs(api, chainId, currencyCombinations);

    Logger.log('To dest tx fee in native currency:', toDestTxFee);
    Logger.log('Original amount', amount);

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;

    const amountWithoutFee = padValueBy(amount, pctDestFee);
    Logger.log('Amount modified', amountWithoutFee);

    if (amountWithoutFee <= 0n) throw new AmountTooLowError();

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
      throw new InvalidParameterError('Extrinsic is null');
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

  async getAmountOut(api: ApiPromise, options: TGetAmountOutOptions): Promise<bigint> {
    const { assetFrom, assetTo, amount, origin } = options;

    const chainId = getParaId(this.chain);

    const tokenMap = getTokenMap(this.chain, chainId);

    const tokenWrappedFrom = findToken(tokenMap, assetFrom.symbol);

    if (tokenWrappedFrom === undefined) {
      throw new InvalidParameterError('Currency from not found');
    }

    const tokenWrappedTo = findToken(tokenMap, assetTo.symbol);

    if (tokenWrappedTo === undefined) {
      throw new InvalidParameterError('Currency to not found');
    }

    const tokenFrom = new Token(tokenWrappedFrom.wrapped);
    const tokenTo = new Token(tokenWrappedTo.wrapped);

    const currencyCombinations = getCurrencyCombinations(chainId, tokenFrom, tokenTo);

    const pairs = await getFilteredPairs(api, chainId, currencyCombinations);

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;

    const amountWithoutFee = padValueBy(amount, pctDestFee);

    const amountIn = Amount.fromRawAmount(tokenFrom, amountWithoutFee.toString());
    const trade = getBestTrade(chainId, pairs, amountIn, tokenTo);

    return parseUnits(trade.outputAmount.toFixed(), tokenTo.decimals);
  }

  async getDexConfig(api: ApiPromise): Promise<TDexConfig> {
    return getDexConfig(api, this.chain);
  }
}

export default BifrostExchange;
