import { Wallet } from '@acala-network/sdk';
import { FixedPointNumber } from '@acala-network/sdk-core';
import { AcalaDex, AggregateDex } from '@acala-network/sdk-swap';
import { getBalanceNative, getNativeAssetSymbol } from '@paraspell/sdk';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import BigNumber from 'bignumber.js';
import { firstValueFrom } from 'rxjs';

import { DEST_FEE_BUFFER_PCT, FEE_BUFFER } from '../../consts';
import { SmallAmountError } from '../../errors/SmallAmountError';
import Logger from '../../Logger/Logger';
import type {
  TDexConfig,
  TGetAmountOutOptions,
  TSingleSwapResult,
  TSwapOptions,
} from '../../types';
import ExchangeChain from '../ExchangeChain';
import { calculateAcalaSwapFee, createAcalaClient, getDexConfig } from './utils';

class AcalaExchange extends ExchangeChain {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: BigNumber,
  ): Promise<TSingleSwapResult> {
    const { papiApi, assetFrom, assetTo, amount, senderAddress, origin } = options;

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

    const amountBN = BigNumber(amount);

    const swapFee = await calculateAcalaSwapFee(dex, wallet, fromToken, toToken, options);
    const totalNativeCurrencyFee = swapFee.plus(toDestTransactionFee).multipliedBy(FEE_BUFFER);

    Logger.log('Total fee native:', totalNativeCurrencyFee.toString());

    const balance = await getBalanceNative({
      api: papiApi,
      address: senderAddress,
      chain: this.chain,
    });

    Logger.log('Native currency balance:', balance.toString());

    const balanceBN = BigNumber(balance.toString());

    if (balanceBN.isLessThan(totalNativeCurrencyFee)) {
      throw new SmallAmountError(
        `The native currency balance on ${this.chain} is too low to cover the fees. Please provide a larger amount.`,
      );
    }

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;

    const amountWithoutFee = amountBN.minus(amountBN.times(pctDestFee)).decimalPlaces(0);

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
    const amountOutBN = BigNumber(amountOut).shiftedBy(toToken.decimals).decimalPlaces(0);

    const nativeAssetSymbol = getNativeAssetSymbol(this.chain);

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

    const amountBN = BigNumber(amount);
    const amountWithoutFee = amountBN.minus(amountBN.times(pctDestFee)).decimalPlaces(0);

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
    const amountOutBN = BigNumber(amountOut)
      .shiftedBy(toToken.decimals)
      .decimalPlaces(0)
      .toString();

    return BigInt(amountOutBN);
  }

  async createApiInstance(): Promise<ApiPromise> {
    return createAcalaClient(this.chain);
  }

  async getDexConfig(api: ApiPromise): Promise<TDexConfig> {
    return getDexConfig(api, this.chain);
  }
}

export default AcalaExchange;
