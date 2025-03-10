import type { TPallet } from '../../types'
import {
  Parents,
  type TSerializedApiCall,
  type TXTransferSection,
  type TXTransferTransferOptions,
  Version
} from '../../types'
import { createMultiAsset, maybeOverrideMultiAssets } from '../xcmPallet/utils'
import { determineDestWeight } from './utils/determineDestWeight'
import { getDestination } from './utils/getDestination'

class XTransferTransferImpl {
  static transferXTransfer<TApi, TRes>(input: TXTransferTransferOptions<TApi, TRes>): TRes {
    const { api, destination, asset, overriddenAsset, pallet, method } = input

    const isMultiLocationDestination = typeof destination === 'object'
    if (isMultiLocationDestination) {
      throw new Error(
        'Multilocation destinations are not supported for specific transfer you are trying to create. In special cases such as xTokens or xTransfer pallet try using address multilocation instead (for both destination and address in same multilocation set (eg. X2 - Parachain, Address). For further assistance please open issue in our repository.'
      )
    }

    const version = Version.V1

    const multiAssets = [
      createMultiAsset(version, asset.amount, {
        parents: Parents.ZERO,
        interior: 'Here'
      })
    ]

    const resolvedMultiAssets = maybeOverrideMultiAssets(
      version,
      asset.amount,
      multiAssets,
      overriddenAsset
    )

    const dest = getDestination(input)

    const section: TXTransferSection = 'transfer'

    const destWeight = determineDestWeight(destination)

    const call: TSerializedApiCall = {
      module: (pallet as TPallet) ?? 'XTransfer',
      section: method ?? section,
      parameters: {
        asset: resolvedMultiAssets[0],
        dest,
        dest_weight: destWeight
      }
    }

    return api.callTxMethod(call)
  }
}

export default XTransferTransferImpl
