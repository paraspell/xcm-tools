// Contains basic structure of polkadotXCM call

import type { PolkadotXcmModule, PolkadotXcmSection, TTransferReturn } from '../../types'
import { type PolkadotXCMTransferInput } from '../../types'

const DEFAULT_FEE_ASSET = 0

class PolkadotXCMTransferImpl {
  static transferPolkadotXCM(
    {
      api,
      header,
      addressSelection,
      currencySelection,
      feeAsset = DEFAULT_FEE_ASSET,
      serializedApiCallEnabled
    }: PolkadotXCMTransferInput,
    section: PolkadotXcmSection,
    fees: 'Unlimited' | { Limited: string } | undefined = undefined
  ): TTransferReturn {
    const module: PolkadotXcmModule = 'polkadotXcm'
    if (serializedApiCallEnabled === true) {
      return {
        module,
        section,
        parameters: [
          header,
          addressSelection,
          currencySelection,
          feeAsset,
          ...(fees !== undefined ? [fees] : [])
        ]
      }
    }

    return fees !== undefined
      ? api.tx[module][section](header, addressSelection, currencySelection, feeAsset, fees)
      : api.tx[module][section](header, addressSelection, currencySelection, feeAsset)
  }
}

export default PolkadotXCMTransferImpl
