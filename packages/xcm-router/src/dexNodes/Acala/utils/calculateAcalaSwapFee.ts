import type { Wallet } from '@acala-network/sdk';
import { FixedPointNumber, type Token } from '@acala-network/sdk-core';
import type { AggregateDex } from '@acala-network/sdk-swap';
import type { TSwapOptions } from '../../../types';
import BigNumber from 'bignumber.js';
import { firstValueFrom } from 'rxjs';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import { calculateTxFee } from '../../../utils';
import Logger from '../../../Logger/Logger';

export const calculateAcalaSwapFee = async (
  dex: AggregateDex,
  wallet: Wallet,
  tokenFrom: Token,
  tokenTo: Token,
  { amount, feeCalcAddress }: TSwapOptions,
): Promise<BigNumber> => {
  const normalNumberAmount = new BigNumber(amount).shiftedBy(-tokenFrom.decimals).toString();

  const feeCalculationResult = await firstValueFrom(
    dex.swap({
      path: [tokenFrom, tokenTo],
      source: 'aggregate',
      mode: 'EXACT_INPUT',
      input: new FixedPointNumber(normalNumberAmount, tokenFrom.decimals),
    }),
  );

  const swapTx = dex.getTradingTx(feeCalculationResult) as unknown as Extrinsic;

  const swapFee = await calculateTxFee(swapTx, feeCalcAddress);
  const swapFeeNativeCurrency = new BigNumber(swapFee.toString());

  const nativeCurrency = wallet.consts.nativeCurrency;

  Logger.log('Swap fee:', swapFeeNativeCurrency.toString(), nativeCurrency);

  return swapFeeNativeCurrency;
};
