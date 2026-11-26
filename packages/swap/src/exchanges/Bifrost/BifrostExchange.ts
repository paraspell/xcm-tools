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
  TPjsGetAmountOutOptions,
  TPjsSwapOptions,
  TSwapResult,
} from '../../types';
import ExchangeChain from '../ExchangeChain';
import { findToken, getBestTrade, getFilteredPairs, getTokenMap } from './utils';
import { getDexConfig } from './utils/getDexConfig';

class BifrostExchange extends ExchangeChain<'PJS'> {
  readonly apiType = 'PJS';

  readonly supportsRecipient = true;

  protected async buildSwap<TApi, TRes, TSigner, TCustomChain extends string = never>(
    options: TPjsSwapOptions<TApi, TRes, TSigner, TCustomChain>,
    toDestTxFee: bigint,
  ): Promise<TSwapResult<TRes>> {
    const { apiPjs, assetFrom, assetTo, amount, recipient, slippagePct, origin } = options;

    Logger.log('To dest tx fee in native currency:', toDestTxFee);
    Logger.log('Original amount', amount);

    const amountWithoutFee = padValueBy(amount, origin ? DEST_FEE_BUFFER_PCT : 0);
    Logger.log('Amount modified', amountWithoutFee);

    if (amountWithoutFee <= 0n) throw new AmountTooLowError();

    const { trade, tokenTo, amountOut } = await this.findBestTrade(
      apiPjs,
      assetFrom.symbol,
      assetTo.symbol,
      amountWithoutFee,
    );

    const allowedSlippage = new Percent(Number(slippagePct) * 100, 10_000);

    const blockNumber = await apiPjs.derive.chain.bestNumber();

    const deadline = blockNumber.toNumber() + 20;

    const { extrinsic } = SwapRouter.swapCallParameters(trade, {
      api: apiPjs,
      allowedSlippage,
      recipient,
      deadline,
    });

    if (extrinsic === null) {
      throw new RoutingResolutionError('Extrinsic is null');
    }

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

  async getAmountOut<TApi, TRes, TSigner, TCustomChain extends string = never>(
    options: TPjsGetAmountOutOptions<TApi, TRes, TSigner, TCustomChain>,
  ): Promise<bigint> {
    const { apiPjs, assetFrom, assetTo, amount, origin } = options;

    const amountWithoutFee = padValueBy(amount, origin ? DEST_FEE_BUFFER_PCT : 0);

    const { amountOut } = await this.findBestTrade(
      apiPjs,
      assetFrom.symbol,
      assetTo.symbol,
      amountWithoutFee,
    );

    return amountOut;
  }

  async getDexConfig(api: ApiPromise): Promise<TDexConfigStored> {
    return getDexConfig(api, this.chain);
  }

  private async findBestTrade(
    api: ApiPromise,
    symbolFrom: string,
    symbolTo: string,
    amountIn: bigint,
  ) {
    const chainId = getParaId(this.chain);
    const tokenMap = getTokenMap(this.chain, chainId);

    const tokenInfoFrom = findToken(tokenMap, symbolFrom);
    if (!tokenInfoFrom) throw new RoutingResolutionError('Currency from not found');

    const tokenInfoTo = findToken(tokenMap, symbolTo);
    if (!tokenInfoTo) throw new RoutingResolutionError('Currency to not found');

    const tokenFrom = new Token(tokenInfoFrom);
    const tokenTo = new Token(tokenInfoTo);

    const pairs = await getFilteredPairs(
      api,
      chainId,
      getCurrencyCombinations(chainId, tokenFrom, tokenTo),
    );

    const trade = getBestTrade(
      chainId,
      pairs,
      Amount.fromRawAmount(tokenFrom, amountIn.toString()),
      tokenTo,
    );

    return {
      trade,
      tokenTo,
      amountOut: parseUnits(trade.outputAmount.toFixed(), tokenTo.decimals),
    };
  }
}

export default BifrostExchange;
