import { isTLocation } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api'
import { InvalidAddressError } from '../errors'
import { dryRun } from '../transfer'
import type { TBypassOptions, TSubstrateTransferBaseOptionsWithSender } from '../types'

/**
 * Helper function to run a dry run on a transaction used by the Builder class.
 */
export const buildDryRun = <TApi, TRes, TSigner>(
  api: PolkadotApi<TApi, TRes, TSigner>,
  tx: TRes,
  options: TSubstrateTransferBaseOptionsWithSender<TApi, TRes, TSigner>,
  bypassOptions?: TBypassOptions
) => {
  const { to, sender, feeAsset, from, currency, version } = options

  if (isTLocation(to)) {
    throw new InvalidAddressError('Location destination is not supported for XCM fee calculation.')
  }

  return dryRun({
    api,
    tx,
    sender,
    origin: from,
    destination: to,
    currency,
    feeAsset,
    version,
    bypassOptions
  })
}
