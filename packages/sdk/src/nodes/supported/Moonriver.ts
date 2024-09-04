// Contains detailed structure of XCM call construction for Moonriver Parachain

import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TSerializedApiCall,
  type TRelayToParaInternalOptions,
  type TForeignAsset,
  type TSelfReserveAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Moonriver extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Moonriver', 'moonriver', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currency, currencyID } = input
    const currencySelection: TSelfReserveAsset | TForeignAsset =
      currency === this.getNativeAssetSymbol() ? 'SelfReserve' : { ForeignAsset: currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }

  transferRelayToPara(options: TRelayToParaInternalOptions): TSerializedApiCall {
    const { version = Version.V3 } = options
    return {
      module: 'xcmPallet',
      section: 'limitedReserveTransferAssets',
      parameters: constructRelayToParaParameters(options, version, true)
    }
  }
}

export default Moonriver
