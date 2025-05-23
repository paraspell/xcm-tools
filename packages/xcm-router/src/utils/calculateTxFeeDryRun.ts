import type { TPapiApi, TPapiTransaction } from '@paraspell/sdk';
import { dryRunOrigin, InvalidParameterError } from '@paraspell/sdk';
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-pjs';
import BigNumber from 'bignumber.js';

import { DRY_RUN_FEE_BUFFER } from '../consts';

export const calculateTxFeeDryRun = async (
  api: TPapiApi,
  node: TNodeDotKsmWithRelayChains,
  tx: TPapiTransaction,
  address: string,
) => {
  const result = await dryRunOrigin({
    api,
    node,
    tx,
    address,
    isFeeAsset: false,
  });

  if (!result.success) {
    throw new InvalidParameterError(
      `Failed to calculate fee using dry run. Node: ${node} Error: ${result.failureReason}`,
    );
  }

  return BigNumber(result.fee.toString()).multipliedBy(DRY_RUN_FEE_BUFFER);
};
