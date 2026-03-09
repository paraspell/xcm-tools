import type { Wallet } from '@acala-network/sdk';
import { FixedPointNumber, type Token } from '@acala-network/sdk-core';
import type { AggregateDex } from '@acala-network/sdk-swap';
import { type Extrinsic, formatUnits } from '@paraspell/sdk-pjs';
import { firstValueFrom } from 'rxjs';

import Logger from '../../../Logger/Logger';
import type { TSwapOptions } from '../../../types';
import { calculateTxFeePjs } from '../../../utils';

export const calculateAcalaSwapFee = async (
  dex: AggregateDex,
  wallet: Wallet,
  tokenFrom: Token,
  tokenTo: Token,
  { amount, feeCalcAddress }: TSwapOptions,
): Promise<bigint> => {
  const normalNumberAmount = formatUnits(amount, tokenFrom.decimals);

  const feeCalculationResult = await firstValueFrom(
    dex.swap({
      path: [tokenFrom, tokenTo],
      source: 'aggregate',
      mode: 'EXACT_INPUT',
      input: new FixedPointNumber(normalNumberAmount, tokenFrom.decimals),
    }),
  );

  const swapTx = dex.getTradingTx(feeCalculationResult) as unknown as Extrinsic;

  const swapFee = await calculateTxFeePjs(swapTx, feeCalcAddress);

  const nativeCurrency = wallet.consts.nativeCurrency;

  Logger.log('Swap fee:', swapFee.toString(), nativeCurrency);

  return swapFee;
};
