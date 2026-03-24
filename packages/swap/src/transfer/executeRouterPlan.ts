import { isChainEvm } from '@paraspell/sdk-core';

import type { TExecuteRouterPlanOptions } from '../types';
import { type TRouterPlan } from '../types';

export const executeRouterPlan = async <TApi, TRes, TSigner>(
  plan: TRouterPlan<TApi, TRes>,
  { signer, evmSigner, onStatusChange, api }: TExecuteRouterPlanOptions<TApi, TRes, TSigner>,
): Promise<string[]> => {
  const txHashes: string[] = [];

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
      txHashes.push(await api.signAndSubmitFinalized(tx, evmSigner as TSigner));
    } else {
      txHashes.push(await api.signAndSubmitFinalized(tx, signer));
    }
  }

  onStatusChange?.({
    type: 'COMPLETED',
    currentStep: plan.length - 1,
    routerPlan: plan,
  });

  return txHashes;
};
