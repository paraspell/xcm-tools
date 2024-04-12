// Contains detailed structure of XCM call construction for Darwinia Parachain

import {
  Version,
  type Extrinsic,
  type TSerializedApiCall,
  type IXTokensTransfer,
  type XTokensTransferInput,
  type TScenario,
  Parents
} from '../../types'
import ParachainNode from '../ParachainNode'
import { NodeNotSupportedError } from '../../errors'
import XTokensTransferImpl from '../XTokensTransferImpl'
import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import { type TMultiLocation } from '../../types/TMultiLocation'

class Darwinia extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Darwinia', 'darwinia', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    return XTokensTransferImpl.transferXTokens(
      input,
      input.currency === 'RING' ? 'SelfReserve' : { ForeignAsset: input.currencyID }
    )
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
  ): any {
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
