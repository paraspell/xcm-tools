import { getBalanceNative, isNodeEvm } from '@paraspell/sdk-pjs';
import type { TExecuteRouterPlanOptions } from '../types';
import { type TRouterPlan } from '../types';
import { submitTransaction } from '../utils/submitTransaction';
import { calculateTxFeeDryRun } from '../utils';
import BigNumber from 'bignumber.js';
import { FEE_BUFFER } from '../consts';

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
  for (const [currentStep, { api, tx, type, node, destinationNode }] of plan.entries()) {
    onStatusChange?.({
      node,
      destinationNode,
      type,
      currentStep: currentStep,
      routerPlan: plan,
    });

    if (type === 'TRANSFER' && destination === destinationNode) {
      const isBifrost = node === 'BifrostPolkadot' || node === 'BifrostKusama';
      if (isBifrost) {
        const fee = await calculateTxFeeDryRun(api, node, tx, senderAddress);
        const nativeBalance = await getBalanceNative({
          api,
          address: senderAddress,
          node,
        });
        const nativeBalanceBN = BigNumber(nativeBalance.toString());
        const feeBN = BigNumber(fee.toString()).multipliedBy(FEE_BUFFER);
        if (nativeBalanceBN.isLessThan(feeBN)) {
          throw new Error(
            `Insufficient balance to cover fees for transfer from ${node} to ${destinationNode}`,
          );
        }
      }
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

  onStatusChange?.({
    type: 'COMPLETED',
    currentStep: plan.length - 1,
    routerPlan: plan,
  });
};
