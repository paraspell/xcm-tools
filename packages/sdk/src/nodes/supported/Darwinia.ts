// Contains detailed structure of XCM call construction for Darwinia Parachain

import {
  Version,
  type TSerializedApiCall,
  type IXTokensTransfer,
  type XTokensTransferInput,
  type TScenario,
  Parents,
  type TSelfReserveAsset,
  type TForeignAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import { NodeNotSupportedError } from '../../errors'
import XTokensTransferImpl from '../xTokens'
import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import { type TMultiLocation } from '../../types/TMultiLocation'

class Darwinia extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Darwinia', 'darwinia', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currencyID } = input
    const currencySelection: TSelfReserveAsset | TForeignAsset =
      input.currency === this.getNativeAssetSymbol() ? 'SelfReserve' : { ForeignAsset: currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }

  createCurrencySpec(
    amount: string,
    scenario: TScenario,
    version: Version,
    currencyId?: string,
    overridedMultiLocation?: TMultiLocation
  ) {
    if (scenario === 'ParaToPara') {
      const interior = {
        X1: {
          PalletInstance: 5
        }
      }
      return createCurrencySpec(amount, version, Parents.ZERO, overridedMultiLocation, interior)
    } else {
      return super.createCurrencySpec(amount, scenario, version, currencyId)
    }
  }
}

export default Darwinia
