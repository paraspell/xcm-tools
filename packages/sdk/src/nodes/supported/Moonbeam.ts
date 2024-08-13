// Contains detailed structure of XCM call construction for Moonbeam Parachain

import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TSerializedApiCall,
  type TRelayToParaInternalOptions,
  type TNodePolkadotKusama,
  type TSelfReserveAsset,
  type TForeignAsset
} from '../../types'
import { getAllNodeProviders } from '../../utils'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Moonbeam extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Moonbeam', 'moonbeam', 'polkadot', Version.V3)
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

  getProvider(): string {
    return getAllNodeProviders(this.node as TNodePolkadotKusama)[2]
  }
}

export default Moonbeam
