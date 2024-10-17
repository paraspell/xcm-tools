import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import {
  Version,
  type XTransferTransferInput,
  Parents,
  type TTransferReturn,
  type XTransferSection,
  type TSerializedApiCallV2
} from '../../types'
import { determineDestWeight } from './determineDestWeight'
import { getDestination } from './getDestination'

class XTransferTransferImpl {
  static transferXTransfer<TApi, TRes>(
    input: XTransferTransferInput<TApi, TRes>
  ): TTransferReturn<TRes> {
    const {
      api,
      amount,
      origin,
      destination,
      serializedApiCallEnabled,
      overridedCurrencyMultiLocation
    } = input

    const isMultiLocationDestination = typeof destination === 'object'
    if (isMultiLocationDestination) {
      throw new Error(
        'Multilocation destinations are not supported for specific transfer you are trying to create. In special cases such as xTokens or xTransfer pallet try using address multilocation instead (for both destination and address in same multilocation set (eg. X2 - Parachain, Address). For further assistance please open issue in our repository.'
      )
    }

    const currencySpec = Object.values(
      createCurrencySpec(amount, Version.V1, Parents.ZERO, overridedCurrencyMultiLocation)
    )[0][0]

    const dest = getDestination(input)

    const section: XTransferSection = 'transfer'

    const destWeight = origin === 'Khala' ? null : determineDestWeight(destination)

    const call: TSerializedApiCallV2 = {
      module: 'XTransfer',
      section,
      parameters: {
        asset: currencySpec,
        dest,
        dest_weight: destWeight
      }
    }

    if (serializedApiCallEnabled === true) {
      return {
        ...call,
        parameters: Object.values(call.parameters)
      }
    }

    return api.callTxMethod(call)
  }
}

export default XTransferTransferImpl
