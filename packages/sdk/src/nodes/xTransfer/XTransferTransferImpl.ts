import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import {
  Version,
  type XTransferTransferInput,
  Parents,
  type TTransferReturn,
  type XTransferSection,
  type XTransferModule
} from '../../types'
import { determineDestWeight } from './determineDestWeight'
import { getDestination } from './getDestination'

class XTransferTransferImpl {
  static transferXTransfer(input: XTransferTransferInput): TTransferReturn {
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

    const module: XTransferModule = 'xTransfer'
    const section: XTransferSection = 'transfer'

    const destWeight = origin === 'Khala' ? null : determineDestWeight(destination)

    if (serializedApiCallEnabled === true) {
      return {
        module,
        section,
        parameters: [currencySpec, dest, destWeight]
      }
    }
    return api.tx[module][section](currencySpec, dest, destWeight)
  }
}

export default XTransferTransferImpl
