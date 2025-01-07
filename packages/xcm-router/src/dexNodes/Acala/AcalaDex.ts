import type { Extrinsic } from '@paraspell/sdk-pjs';
import ExchangeNode from '../DexNode';
import { FixedPointNumber } from '@acala-network/sdk-core';
import { AcalaDex, AggregateDex } from '@acala-network/sdk-swap';
import { Wallet } from '@acala-network/sdk';
import type { TSwapResult, TSwapOptions, TAssets } from '../../types';
import { firstValueFrom } from 'rxjs';
import type { ApiPromise } from '@polkadot/api';
import { calculateAcalaTransactionFee, createAcalaApiInstance } from './utils';
import BigNumber from 'bignumber.js';
import { FEE_BUFFER } from '../../consts';
import Logger from '../../Logger/Logger';
import { SmallAmountError } from '../../errors/SmallAmountError';

class AcalaExchangeNode extends ExchangeNode {
  async swapCurrency(
    api: ApiPromise,
    options: TSwapOptions,
    toDestTransactionFee: BigNumber,
    toExchangeTransactionFee: BigNumber,
  ): Promise<TSwapResult> {
    const { assetFrom, assetTo, currencyFrom, currencyTo, amount } = options;

    const wallet = new Wallet(api);
    await wallet.isReady;

    const fromToken = wallet.getToken(
      assetFrom?.symbol ?? ('symbol' in currencyFrom ? currencyFrom.symbol : ''),
    );
    const toToken = wallet.getToken(
      assetTo?.symbol ?? ('symbol' in currencyTo ? currencyTo.symbol : ''),
    );

    const acalaDex = new AcalaDex({ api, wallet });

    const dex = new AggregateDex({
      api,
      wallet,
      providers: [acalaDex],
    });

    const amountBN = new BigNumber(amount);

    const feeInCurrencyFromBN = await calculateAcalaTransactionFee(
      dex,
      wallet,
      fromToken,
      toToken,
      options,
      toDestTransactionFee,
    );

    Logger.log(
      'XCM to exch. fee:',
      toExchangeTransactionFee.shiftedBy(-fromToken.decimals).toString(),
      fromToken.symbol,
    );

    const toExchangeFeeWithBuffer = toExchangeTransactionFee.multipliedBy(FEE_BUFFER);

    Logger.log(
      'XCM to exch. fee /w buffer:',
      toExchangeFeeWithBuffer.shiftedBy(-fromToken.decimals).toString(),
      fromToken.symbol,
    );

    const amountWithoutFee = amountBN.minus(feeInCurrencyFromBN).minus(toExchangeFeeWithBuffer);

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

    Logger.log('Calculated amount out:', amountOutBN.toString());
    Logger.log('Amount out decimals', toToken.decimals);

    const nativeCurrency = wallet.consts.nativeCurrency;
    const nativeCurrencyDecimals = wallet.getToken(nativeCurrency).decimals;

    const convertedFeeNativeCurrency = toDestTransactionFee
      .shiftedBy(-nativeCurrencyDecimals)
      .toNumber();

    const nativeCurrencyUsdPrice = (await wallet.getPrice(nativeCurrency)).toNumber();
    const currencyToUsdPrice = (await wallet.getPrice(toToken.symbol)).toNumber();

    if (currencyToUsdPrice === 0) {
      throw new Error(`Could not fetch price for ${toToken.symbol}`);
    }

    const feeInUsd = convertedFeeNativeCurrency * nativeCurrencyUsdPrice;

    const feeInCurrencyTo = (feeInUsd / currencyToUsdPrice) * FEE_BUFFER;

    Logger.log('Amount out fee', feeInCurrencyTo.toString(), nativeCurrency);

    const currencyToFeeBnum = new BigNumber(feeInCurrencyTo).shiftedBy(toToken.decimals);
    const amountOutModified = amountOutBN.minus(currencyToFeeBnum).decimalPlaces(0);

    if (amountOutModified.isNegative()) {
      throw new SmallAmountError(
        'The amount after deducting fees is negative. Please provide a larger amount.',
      );
    }

    Logger.log('Amount out original', amountOut.toString());
    Logger.log('Amount out modified', amountOutModified.toString());

    return { tx, amountOut: amountOutModified.toString() };
  }

  async createApiInstance(): Promise<ApiPromise> {
    return createAcalaApiInstance(this.node);
  }

  async getAssets(api: ApiPromise): Promise<TAssets> {
    const wallet = new Wallet(api);
    await wallet.isReady;
    const tokens = await wallet.getTokens();
    return Object.values(tokens).reduce<TAssets>((acc, token) => {
      const idObject = JSON.parse(token.toCurrencyId(api).toString()) as Record<string, unknown>;

      const firstKey = Object.keys(idObject)[0];
      const firstValue = idObject[firstKey] as string;

      if (!Array.isArray(firstValue)) {
        if (firstKey.toLowerCase() === 'token') {
          acc.push({ symbol: token.symbol });
        } else {
          const formattedId =
            typeof firstValue === 'object' ? JSON.stringify(firstValue) : firstValue.toString();
          acc.push({
            symbol: token.symbol,
            id: formattedId,
          });
        }
      }
      return acc;
    }, []);
  }
}

export default AcalaExchangeNode;
