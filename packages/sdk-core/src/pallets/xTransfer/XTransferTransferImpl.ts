import { getCurrency } from '../../pallets/xcmPallet/utils'
import type { TPallet } from '../../types'
import {
  Version,
  type TXTransferTransferOptions,
  Parents,
  type TXTransferSection,
  type TSerializedApiCall
} from '../../types'
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

    const currencySpec = getCurrency(asset.amount, Version.V1, Parents.ZERO, overriddenAsset)[0]

    const dest = getDestination(input)

    const section: TXTransferSection = 'transfer'

    const destWeight = determineDestWeight(destination)

    const call: TSerializedApiCall = {
      module: (pallet as TPallet) ?? 'XTransfer',
      section: method ?? section,
      parameters: {
        asset: currencySpec,
        dest,
        dest_weight: destWeight
      }
    }

    return api.callTxMethod(call)
  }
}

export default XTransferTransferImpl
