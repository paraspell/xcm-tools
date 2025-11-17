import type { TPallet } from '@paraspell/pallets'
import { Parents, Version } from '@paraspell/sdk-common'

import {
  type TSerializedExtrinsics,
  type TXTransferMethod,
  type TXTransferTransferOptions
} from '../../types'
import { assertToIsString, createBeneficiaryLocXTokens } from '../../utils'
import { createAsset, maybeOverrideAsset } from '../../utils/asset'
import { ERR_LOCATION_DEST_NOT_SUPPORTED } from '../xTokens'
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

  assertToIsString(destination, ERR_LOCATION_DEST_NOT_SUPPORTED)

  // XTransfer pallet does not require version specification
  // but the XCM syntax matches the V3 format
  const version = Version.V3

  const multiAsset = createAsset(version, asset.amount, {
    parents: Parents.ZERO,
    interior: 'Here'
  })

  const resolvedMultiAsset = maybeOverrideAsset(version, asset.amount, multiAsset, overriddenAsset)

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

  const call: TSerializedExtrinsics = {
    module: (pallet as TPallet) ?? 'XTransfer',
    method: methodOverride ?? method,
    params: {
      asset: resolvedMultiAsset,
      dest,
      dest_weight: destWeight
    }
  }

  return api.deserializeExtrinsics(call)
}
