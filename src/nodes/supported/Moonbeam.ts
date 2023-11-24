// Contains detailed structure of XCM call construction for Moonbeam Parachain

import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall,
  type TTransferRelayToParaOptions
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Moonbeam extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Moonbeam', 'moonbeam', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    const { currency, currencyID } = input
    const currencySelection = currency === 'GLMR' ? 'SelfReserve ' : { ForeignAsset: currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }

  transferRelayToPara(options: TTransferRelayToParaOptions): TSerializedApiCall {
    return {
      module: 'xcmPallet',
      section: 'limitedReserveTransferAssets',
      parameters: constructRelayToParaParameters(options, Version.V3, true)
    }
  }
}

export default Moonbeam
