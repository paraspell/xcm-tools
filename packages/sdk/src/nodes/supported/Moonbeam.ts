// Contains detailed structure of XCM call construction for Moonbeam Parachain

import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall,
  type TRelayToParaInternalOptions
} from '../../types'
import { getAllNodeProviders } from '../../utils'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Moonbeam extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Moonbeam', 'moonbeam', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    const { currency, currencyID } = input
    const currencySelection = currency === 'GLMR' ? 'SelfReserve' : { ForeignAsset: currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }

  transferRelayToPara(options: TRelayToParaInternalOptions): TSerializedApiCall {
    return {
      module: 'xcmPallet',
      section: 'limitedReserveTransferAssets',
      parameters: constructRelayToParaParameters(options, Version.V3, true)
    }
  }

  getProvider(): string {
    return getAllNodeProviders(this.node)[2]
  }
}

export default Moonbeam
