import { isNodeEvm } from '@paraspell/sdk-pjs';
import type { TExecuteRouterPlanOptions } from '../types';
import { RouterEventType, TransactionType, type TRouterPlan } from '../types';
import { submitTransaction } from '../utils/submitTransaction';

export const executeRouterPlan = async (
  plan: TRouterPlan,
  { signer, senderAddress, evmSigner, evmSenderAddress, onStatusChange }: TExecuteRouterPlanOptions,
): Promise<void> => {
  for (const [index, { api, tx, type, node, destinationNode }] of plan.entries()) {
    if (onStatusChange) {
      onStatusChange({
        node,
        destinationNode,
        type: type === TransactionType.TRANSFER ? RouterEventType.TRANSFER : RouterEventType.SWAP,
        currentStep: index,
        totalSteps: plan.length,
      });
    }

    if (isNodeEvm(node)) {
      if (!evmSigner || !evmSenderAddress) {
        throw new Error('EVM signer and sender address must be provided for EVM nodes.');
      }

      await submitTransaction(api, tx, evmSigner, evmSenderAddress);
    } else {
      await submitTransaction(api, tx, signer, senderAddress);
    }
  }

  if (onStatusChange) {
    onStatusChange({
      type: RouterEventType.COMPLETED,
      currentStep: plan.length - 1,
      totalSteps: plan.length,
    });
  }
};
