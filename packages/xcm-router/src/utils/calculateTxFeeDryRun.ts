import type { TAssetInfo, TChain, TPapiApi, TPapiTransaction, WithAmount } from '@paraspell/sdk';
import { dryRunOrigin, InvalidParameterError } from '@paraspell/sdk';
import type { TSubstrateChain } from '@paraspell/sdk-pjs';
import BigNumber from 'bignumber.js';

import { DRY_RUN_FEE_BUFFER } from '../consts';

export const calculateTxFeeDryRun = async (
  api: TPapiApi,
  chain: TSubstrateChain,
  destination: TChain,
  tx: TPapiTransaction,
  address: string,
) => {
  const result = await dryRunOrigin({
    api,
    chain,
    destination,
    tx,
    address,
    asset: {} as WithAmount<TAssetInfo>,
  });

  if (!result.success) {
    throw new InvalidParameterError(
      `Failed to calculate fee using dry run. Chain: ${chain} Error: ${result.failureReason}`,
    );
  }

  return BigNumber(result.fee.toString()).multipliedBy(DRY_RUN_FEE_BUFFER);
};
