import { Wallet } from '@acala-network/sdk';
import { FixedPointNumber } from '@acala-network/sdk-core';
import { AcalaDex, AggregateDex } from '@acala-network/sdk-swap';
import {
  AmountTooLowError,
  formatUnits,
  getBalance,
  getNativeAssetSymbol,
  padValueBy,
  parseUnits,
} from '@paraspell/sdk-core';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import type { ApiPromise } from '@polkadot/api';
import { firstValueFrom } from 'rxjs';

import { DEST_FEE_BUFFER_PCT, FEE_BUFFER_PCT } from '../../consts';
import Logger from '../../Logger/Logger';
import type {
  TDexConfigStored,
  TPjsGetAmountOutOptions,
  TPjsSwapOptions,
  TSingleSwapResult,
} from '../../types';
import ExchangeChain from '../ExchangeChain';
import { calculateAcalaSwapFee, createAcalaClient, getDexConfig } from './utils';

class AcalaExchange extends ExchangeChain<'PJS'> {
  readonly apiType = 'PJS';

  async swapCurrency<TApi, TRes, TSigner, TCustomChain extends string = never>(
    options: TPjsSwapOptions<TApi, TRes, TSigner, TCustomChain>,
    toDestTransactionFee: bigint,
  ): Promise<TSingleSwapResult<TRes>> {
    const { api, apiPjs, assetFrom, assetTo, amount, sender, origin, isForFeeEstimation, slippagePct } = options;

    const wallet = new Wallet(apiPjs);
    await wallet.isReady;

    const fromToken = wallet.getToken(assetFrom.symbol);
    const toToken = wallet.getToken(assetTo.symbol);

    const acalaDex = new AcalaDex({ api: apiPjs, wallet });

    const dex = new AggregateDex({
      api: apiPjs,
      wallet,
      providers: [acalaDex],
    });

    const swapFee = await calculateAcalaSwapFee(dex, wallet, fromToken, toToken, options);

    const totalNativeCurrencyFee = padValueBy(swapFee + toDestTransactionFee, FEE_BUFFER_PCT);

    Logger.log('Total fee native:', totalNativeCurrencyFee);

    const balance = await getBalance({
      api,
      address: sender,
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

    const slippageMultiplier = Number(slippagePct);

    const tradeResult = await firstValueFrom(
      dex.swap({
        path: [fromToken, toToken],
        source: 'aggregate',
        mode: 'EXACT_INPUT',
        input: new FixedPointNumber(
          formatUnits(amountWithoutFee, fromToken.decimals),
          fromToken.decimals,
        ),
        acceptiveSlippage: slippageMultiplier,
      }),
    );

    // Apply slippage protection: compute the minimum acceptable output and
    // pass it as an overwrite to getTradingTx so the constructed extrinsic
    // includes a slippage floor (matching AssetHub, Bifrost, and Hydration).
    const amountOutRes = tradeResult.result.output.amount.toString();
    const amountOut = parseUnits(amountOutRes, toToken.decimals);
    const minAmountOut = padValueBy(amountOut, -slippageMultiplier);
    const minOutputFpn = new FixedPointNumber(
      formatUnits(minAmountOut, toToken.decimals),
      toToken.decimals,
    );

    const tx = dex.getTradingTx(tradeResult, { output: minOutputFpn }) as unknown as Extrinsic;

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

  async getAmountOut<TApi, TRes, TSigner, TCustomChain extends string = never>(
    options: TPjsGetAmountOutOptions<TApi, TRes, TSigner, TCustomChain>,
  ) {
    const { apiPjs, assetFrom, assetTo, amount, origin } = options;

    const wallet = new Wallet(apiPjs);
    await wallet.isReady;

    const fromToken = wallet.getToken(assetFrom.symbol);
    const toToken = wallet.getToken(assetTo.symbol);

    const acalaDex = new AcalaDex({ api: apiPjs, wallet });

    const dex = new AggregateDex({
      api: apiPjs,
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

  async getDexConfig(api: ApiPromise): Promise<TDexConfigStored> {
    return getDexConfig(api, this.chain);
  }
}

export default AcalaExchange;
