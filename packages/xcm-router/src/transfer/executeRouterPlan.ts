import { isChainEvm } from '@paraspell/sdk';
import type { PolkadotSigner } from 'polkadot-api';

import type { TExecuteRouterPlanOptions } from '../types';
import { type TRouterPlan } from '../types';
import { submitTransaction } from '../utils/submitTransaction';

export const executeRouterPlan = async (
  plan: TRouterPlan,
  { signer, evmSigner, onStatusChange }: TExecuteRouterPlanOptions,
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
      // Evm signer is guaranteed to be defined here
      // because of prior validation
      await submitTransaction(tx, evmSigner as PolkadotSigner);
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
