import type { TNodeDotKsmWithRelayChains, TPjsApi } from '@paraspell/sdk-pjs';
import { type Extrinsic, getDryRun } from '@paraspell/sdk-pjs';
import BigNumber from 'bignumber.js';

import { DRY_RUN_FEE_BUFFER } from '../consts';

export const calculateTxFeeDryRun = async (
  api: TPjsApi,
  node: TNodeDotKsmWithRelayChains,
  tx: Extrinsic,
  address: string,
) => {
  const result = await getDryRun({
    api,
    node,
    tx,
    address,
  });

  if (!result.success) {
    throw new Error(
      `Failed to calculate fee using dry run. Node: ${node} Error: ${result.failureReason}`,
    );
  }

  return BigNumber(result.fee.toString()).multipliedBy(DRY_RUN_FEE_BUFFER);
};
