import { InvalidParameterError, isChainEvm } from '@paraspell/sdk';

import type { TExecuteRouterPlanOptions } from '../types';
import { type TRouterPlan } from '../types';
import { submitTransaction } from '../utils/submitTransaction';

export const executeRouterPlan = async (
  plan: TRouterPlan,
  { signer, evmSigner, evmSenderAddress, onStatusChange }: TExecuteRouterPlanOptions,
): Promise<void> => {
  for (const [currentStep, { tx, type, chain, destinationChain }] of plan.entries()) {
    onStatusChange?.({
      chain,
      destinationChain,
      type,
      currentStep: currentStep,
      routerPlan: plan,
    });

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
