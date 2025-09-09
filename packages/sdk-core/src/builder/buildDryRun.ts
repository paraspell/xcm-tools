import { isTLocation } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api'
import { InvalidParameterError } from '../errors'
import { dryRun } from '../transfer'
import type { TBypassOptions, TSendBaseOptionsWithSenderAddress } from '../types'

/**
 * Helper function to run a dry run on a transaction used by the Builder class.
 */
export const buildDryRun = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  tx: TRes,
  options: TSendBaseOptionsWithSenderAddress,
  bypassOptions?: TBypassOptions
) => {
  const { to, address, senderAddress, feeAsset, from, currency } = options

  if (isTLocation(to)) {
    throw new InvalidParameterError(
      'Location destination is not supported for XCM fee calculation.'
    )
  }

  if (isTLocation(address)) {
    throw new InvalidParameterError('Location address is not supported for XCM fee calculation.')
  }

  return dryRun({
    api,
    tx,
    address: senderAddress,
    origin: from,
    destination: to,
    currency,
    senderAddress,
    feeAsset,
    bypassOptions
  })
}
