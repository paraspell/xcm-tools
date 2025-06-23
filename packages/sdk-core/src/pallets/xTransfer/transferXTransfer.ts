import type { TPallet } from '@paraspell/pallets'
import { Parents, Version } from '@paraspell/sdk-common'

import {
  type TSerializedApiCall,
  type TXTransferMethod,
  type TXTransferTransferOptions
} from '../../types'
import { assertToIsString, createBeneficiaryLocXTokens } from '../../utils'
import { createMultiAsset, maybeOverrideMultiAsset } from '../../utils/multiAsset'
import { ERR_MULTILOCATION_DEST_NOT_SUPPORTED } from '../xTokens'
import { determineDestWeight } from './utils/determineDestWeight'

export const transferXTransfer = <TApi, TRes>(
  input: TXTransferTransferOptions<TApi, TRes>
): TRes => {
  const {
    api,
    origin,
    destination,
    asset,
    overriddenAsset,
    recipientAddress,
    pallet,
    method: methodOverride,
    paraIdTo
  } = input

  assertToIsString(destination, ERR_MULTILOCATION_DEST_NOT_SUPPORTED)

  // XTransfer pallet does not require version specification
  // but the XCM syntax matches the V3 format
  const version = Version.V3

  const multiAsset = createMultiAsset(version, asset.amount, {
    parents: Parents.ZERO,
    interior: 'Here'
  })

  const resolvedMultiAsset = maybeOverrideMultiAsset(
    version,
    asset.amount,
    multiAsset,
    overriddenAsset
  )

  const dest = createBeneficiaryLocXTokens({
    api,
    origin,
    destination,
    address: recipientAddress,
    version,
    paraId: paraIdTo
  })

  const destWeight = determineDestWeight(destination)

  const method: TXTransferMethod = 'transfer'

  const call: TSerializedApiCall = {
    module: (pallet as TPallet) ?? 'XTransfer',
    method: methodOverride ?? method,
    parameters: {
      asset: resolvedMultiAsset,
      dest,
      dest_weight: destWeight
    }
  }

  return api.callTxMethod(call)
}
