import { Wallet } from '@acala-network/sdk';
import { FixedPointNumber } from '@acala-network/sdk-core';
import { AcalaDex, AggregateDex } from '@acala-network/sdk-swap';
import {
  AmountTooLowError,
  formatUnits,
  getBalanceNative,
  getNativeAssetSymbol,
  padValueBy,
  parseUnits,
} from '@paraspell/sdk';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import { firstValueFrom } from 'rxjs';

import { DEST_FEE_BUFFER_PCT, FEE_BUFFER_PCT } from '../../consts';
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
    toDestTransactionFee: bigint,
  ): Promise<TSingleSwapResult> {
    const { papiApi, assetFrom, assetTo, amount, senderAddress, origin, isForFeeEstimation } =
      options;

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

    const swapFee = await calculateAcalaSwapFee(dex, wallet, fromToken, toToken, options);

    const totalNativeCurrencyFee = padValueBy(swapFee + toDestTransactionFee, FEE_BUFFER_PCT);

    Logger.log('Total fee native:', totalNativeCurrencyFee);

    const balance = await getBalanceNative({
      api: papiApi,
      address: senderAddress,
      chain: this.chain,
    });

    Logger.log('Native currency balance:', balance);

    if (balance < totalNativeCurrencyFee && !isForFeeEstimation) {
      throw new AmountTooLowError(
        `The native currency balance on ${this.chain} is too low to cover the fees. Please provide a larger amount.`,
      );
    }

    const pctDestFee = origin ? DEST_FEE_BUFFER_PCT : 0;

    const amountWithoutFee = padValueBy(amount, pctDestFee);

    if (amountWithoutFee <= 0n) {
      throw new AmountTooLowError(
        'The provided amount is too small to cover the fees. Please provide a larger amount.',
      );
    }

    Logger.log('Original amount', amount);
    Logger.log('Amount modified', amountWithoutFee);

    const tradeResult = await firstValueFrom(
      dex.swap({
        path: [fromToken, toToken],
        source: 'aggregate',
        mode: 'EXACT_INPUT',
        input: new FixedPointNumber(
          formatUnits(amountWithoutFee, fromToken.decimals),
          fromToken.decimals,
        ),
      }),
    );

    const tx = dex.getTradingTx(tradeResult) as unknown as Extrinsic;

    const amountOutRes = tradeResult.result.output.amount.toString();
    const amountOut = parseUnits(amountOutRes, toToken.decimals);

    const nativeAssetSymbol = getNativeAssetSymbol(this.chain);

    if (toToken.symbol === nativeAssetSymbol) {
      const amountOutWithFee = padValueBy(amountOut - toDestTransactionFee, FEE_BUFFER_PCT);
      Logger.log('Amount out with fee:', amountOutWithFee);
      Logger.log('Amount out decimals', toToken.decimals);
      return { tx, amountOut: amountOutWithFee };
    }

    Logger.log('Calculated amount out:', amountOut);
    Logger.log('Amount out decimals', toToken.decimals);

    return { tx, amountOut };
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

    const amountWithoutFee = padValueBy(amount, pctDestFee);

    const tradeResult = await firstValueFrom(
      dex.swap({
        path: [fromToken, toToken],
        source: 'aggregate',
        mode: 'EXACT_INPUT',
        input: new FixedPointNumber(
          formatUnits(amountWithoutFee, fromToken.decimals),
          fromToken.decimals,
        ),
      }),
    );

    const amountOutRes = tradeResult.result.output.amount.toString();

    return parseUnits(amountOutRes, toToken.decimals);
  }

  async createApiInstance(): Promise<ApiPromise> {
    return createAcalaClient(this.chain);
  }

  async getDexConfig(api: ApiPromise): Promise<TDexConfig> {
    return getDexConfig(api, this.chain);
  }
}

export default AcalaExchange;
