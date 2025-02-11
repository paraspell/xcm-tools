import ExchangeNode from '../DexNode';
import type { TSwapResult, TSwapOptions, TAssets } from '../../types';
import type { ApiPromise } from '@polkadot/api';
import { getNativeAssetSymbol, getOtherAssets, getParaId } from '@paraspell/sdk-pjs';
import { findToken, getBestTrade, getFilteredPairs, getTokenMap } from './utils';
import { Amount, Token, getCurrencyCombinations } from '@crypto-dex-sdk/currency';
import { SwapRouter } from '@crypto-dex-sdk/parachains-bifrost';
import { Percent } from '@crypto-dex-sdk/math';
import BigNumber from 'bignumber.js';
import { DEST_FEE_BUFFER_PCT, FEE_BUFFER } from '../../consts';
import Logger from '../../Logger/Logger';
import { SmallAmountError } from '../../errors/SmallAmountError';

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
      const amountOutWithFee = amountOutBN.minus(toDestTxFee).multipliedBy(FEE_BUFFER);
      Logger.log('Amount out with fee:', amountOutWithFee.toString());
      return { tx: extrinsic[0], amountOut: amountOutWithFee.toString() };
    }

    Logger.log('Calculated amount out:', amountOutBN.toString());

    return {
      tx: extrinsic[0],
      amountOut: amountOutBN.toString(),
    };
  }

  async getAssets(_api: ApiPromise): Promise<TAssets> {
    const chainId = getParaId(this.node);
    const tokenMap = getTokenMap(this.node, chainId);
    const assets = Object.values(tokenMap).map((item) => ({
      symbol: item.wrapped.symbol ?? '',
      id: getOtherAssets(this.node).find((asset) => asset.symbol === item.wrapped.symbol)?.assetId,
    }));
    return Promise.resolve(assets);
  }
}

export default BifrostExchangeNode;
