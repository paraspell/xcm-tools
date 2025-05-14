import { Wallet } from '@acala-network/sdk';
import { FixedPointNumber } from '@acala-network/sdk-core';
import { AcalaDex, AggregateDex } from '@acala-network/sdk-swap';
import { type Extrinsic, getBalanceNative, getNativeAssetSymbol } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import BigNumber from 'bignumber.js';
import { firstValueFrom } from 'rxjs';

import { DEST_FEE_BUFFER_PCT, FEE_BUFFER } from '../../consts';
import { SmallAmountError } from '../../errors/SmallAmountError';
import Logger from '../../Logger/Logger';
import type { TDexConfig, TGetAmountOutOptions, TSwapOptions, TSwapResult } from '../../types';
import ExchangeNode from '../DexNode';
import { calculateAcalaSwapFee, createAcalaApiInstance, getDexConfig } from './utils';

class AcalaExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: BigNumber,
  ): Promise<TSwapResult> {
    const { assetFrom, assetTo, amount, senderAddress, origin } = options;

    const wallet = new Wallet(api);
    await wallet.isReady;

    const fromToken = wallet.getToken(assetFrom.symbol);
    const toToken = wallet.getToken(assetTo.symbol);

    const acalaDex = new AcalaDex({ api, wallet });

    const dex = new AggregateDex({
      api,
      wallet,
      providers: [acalaDex],
    });

    const amountBN = new BigNumber(amount);

    const swapFee = await calculateAcalaSwapFee(dex, wallet, fromToken, toToken, options);
    const totalNativeCurrencyFee = swapFee.plus(toDestTransactionFee).multipliedBy(FEE_BUFFER);

    Logger.log('Total fee native:', totalNativeCurrencyFee.toString());

    const balance = await getBalanceNative({
      api,
      address: senderAddress,
      node: this.node,
    });

    Logger.log('Native currency balance:', balance.toString());

    const balanceBN = new BigNumber(balance.toString());

    if (balanceBN.isLessThan(totalNativeCurrencyFee)) {
      throw new SmallAmountError(
        `The native currency balance on ${this.node} is too low to cover the fees. Please provide a larger amount.`,
      );
    }

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;

    const amountWithoutFee = amountBN.minus(amountBN.times(pctDestFee));

    if (amountWithoutFee.isNegative()) {
      throw new SmallAmountError(
        'The provided amount is too small to cover the fees. Please provide a larger amount.',
      );
    }

    Logger.log('Original amount', amount);
    Logger.log('Amount modified', amountWithoutFee.toString());

    const tradeResult = await firstValueFrom(
      dex.swap({
        path: [fromToken, toToken],
        source: 'aggregate',
        mode: 'EXACT_INPUT',
        input: new FixedPointNumber(
          amountWithoutFee.shiftedBy(-fromToken.decimals).toString(),
          fromToken.decimals,
        ),
      }),
    );

    const tx = dex.getTradingTx(tradeResult) as unknown as Extrinsic;

    const amountOut = tradeResult.result.output.amount.toString();
    const amountOutBN = new BigNumber(amountOut).shiftedBy(toToken.decimals);

    const nativeAssetSymbol = getNativeAssetSymbol(this.node);

    if (toToken.symbol === nativeAssetSymbol) {
      const amountOutWithFee = amountOutBN
        .minus(toDestTransactionFee)
        .multipliedBy(FEE_BUFFER)
        .decimalPlaces(0);
      Logger.log('Amount out with fee:', amountOutWithFee.toString());
      Logger.log('Amount out decimals', toToken.decimals);
      return { tx, amountOut: amountOutWithFee.toString() };
    }

    Logger.log('Calculated amount out:', amountOutBN.toString());
    Logger.log('Amount out decimals', toToken.decimals);

    return { tx, amountOut: amountOutBN.toString() };
  }

  async getAmountOut(api: ApiPromise, options: TGetAmountOutOptions) {
    const { assetFrom, assetTo, amount, origin } = options;

    const wallet = new Wallet(api);
    await wallet.isReady;

    const fromToken = wallet.getToken(assetFrom.symbol);
    const toToken = wallet.getToken(assetTo.symbol);

    const acalaDex = new AcalaDex({ api, wallet });

    const dex = new AggregateDex({
      api,
      wallet,
      providers: [acalaDex],
    });

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;

    const amountBN = new BigNumber(amount);
    const amountWithoutFee = amountBN.minus(amountBN.times(pctDestFee));

    const tradeResult = await firstValueFrom(
      dex.swap({
        path: [fromToken, toToken],
        source: 'aggregate',
        mode: 'EXACT_INPUT',
        input: new FixedPointNumber(
          amountWithoutFee.shiftedBy(-fromToken.decimals).toString(),
          fromToken.decimals,
        ),
      }),
    );

    const amountOut = tradeResult.result.output.amount.toString();

    return BigInt(amountOut);
  }

  async createApiInstance(): Promise<ApiPromise> {
    return createAcalaApiInstance(this.node);
  }

  async getDexConfig(api: ApiPromise): Promise<TDexConfig> {
    return getDexConfig(api, this.node);
  }
}

export default AcalaExchangeNode;
