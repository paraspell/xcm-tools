import type { TChain } from '@paraspell/sdk';
import { getBalanceNative, InvalidParameterError, isChainEvm } from '@paraspell/sdk';
import BigNumber from 'bignumber.js';

import { FEE_BUFFER } from '../consts';
import type { TExecuteRouterPlanOptions } from '../types';
import { type TRouterPlan } from '../types';
import { calculateTxFeeDryRun } from '../utils';
import { submitTransaction } from '../utils/submitTransaction';

export const executeRouterPlan = async (
  plan: TRouterPlan,
  {
    signer,
    senderAddress,
    destination,
    evmSigner,
    evmSenderAddress,
    onStatusChange,
  }: TExecuteRouterPlanOptions,
): Promise<void> => {
  for (const [currentStep, { api, tx, type, chain, destinationChain }] of plan.entries()) {
    onStatusChange?.({
      chain,
      destinationChain,
      type,
      currentStep: currentStep,
      routerPlan: plan,
    });

    if (type === 'TRANSFER' && destination === destinationChain) {
      const isBifrost = chain === 'BifrostPolkadot' || chain === 'BifrostKusama';
      if (isBifrost) {
        const fee = await calculateTxFeeDryRun(
          api,
          chain,
          destination as TChain,
          tx,
          senderAddress,
        );
        const nativeBalance = await getBalanceNative({
          api,
          address: senderAddress,
          chain,
        });
        const nativeBalanceBN = BigNumber(nativeBalance.toString());
        const feeBN = BigNumber(fee.toString()).multipliedBy(FEE_BUFFER);
        if (nativeBalanceBN.isLessThan(feeBN)) {
          throw new InvalidParameterError(
            `Insufficient balance to cover fees for transfer from ${chain} to ${destinationChain}`,
          );
        }
      }
    }

    if (isChainEvm(chain)) {
      if (!evmSigner || !evmSenderAddress) {
        throw new InvalidParameterError(
          'EVM signer and sender address must be provided for EVM chains.',
        );
      }

      await submitTransaction(tx, evmSigner);
    } else {
      await submitTransaction(tx, signer);
    }
  }

  onStatusChange?.({
    type: 'COMPLETED',
    currentStep: plan.length - 1,
    routerPlan: plan,
  });
};
