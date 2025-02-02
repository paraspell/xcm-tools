import { isNodeEvm } from '@paraspell/sdk-pjs';
import type { TExecuteRouterPlanOptions } from '../types';
import { type TRouterPlan } from '../types';
import { submitTransaction } from '../utils/submitTransaction';

export const executeRouterPlan = async (
  plan: TRouterPlan,
  { signer, senderAddress, evmSigner, evmSenderAddress, onStatusChange }: TExecuteRouterPlanOptions,
): Promise<void> => {
  for (const [currentStep, { api, tx, type, node, destinationNode }] of plan.entries()) {
    onStatusChange?.({
      node,
      destinationNode,
      type,
      currentStep: currentStep,
      routerPlan: plan,
    });

    if (isNodeEvm(node)) {
      if (!evmSigner || !evmSenderAddress) {
        throw new Error('EVM signer and sender address must be provided for EVM nodes.');
      }

      await submitTransaction(api, tx, evmSigner, evmSenderAddress);
    } else {
      await submitTransaction(api, tx, signer, senderAddress);
    }
  }

  onStatusChange?.({
    type: 'COMPLETED',
    currentStep: plan.length - 1,
    routerPlan: plan,
  });
};
