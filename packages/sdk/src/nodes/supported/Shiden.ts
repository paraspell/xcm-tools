// Contains detailed structure of XCM call construction for Shiden Parachain

import {
  Version,
  type IPolkadotXCMTransfer,
  type IXTokensTransfer,
  type PolkadotXCMTransferInput,
  type TSendInternalOptions,
  type XTokensTransferInput
} from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class Shiden extends ParachainNode implements IPolkadotXCMTransfer, IXTokensTransfer {
  constructor() {
    super('Shiden', 'shiden', 'kusama', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    // Same as Astar, works
    // https://shiden.subscan.io/xcm_message/kusama-97eb47c25c781affa557f36dbd117d49f7e1ab4e
    return getNode('Astar').transferPolkadotXCM(input)
  }

  transferXTokens(input: XTokensTransferInput) {
    return getNode('Astar').transferXTokens(input)
  }

  protected canUseXTokens({ currencySymbol, currencyId }: TSendInternalOptions): boolean {
    return currencySymbol !== this.getNativeAssetSymbol() || !!currencyId
  }
}

export default Shiden
