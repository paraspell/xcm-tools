// Contains detailed structure of XCM call construction for Astar Parachain

import {
  Version,
  type IPolkadotXCMTransfer,
  type IXTokensTransfer,
  type PolkadotXCMTransferInput,
  type TSendInternalOptions,
  type XTokensTransferInput
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import XTokensTransferImpl from '../xTokens'

class Astar extends ParachainNode implements IPolkadotXCMTransfer, IXTokensTransfer {
  constructor() {
    super('Astar', 'astar', 'polkadot', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    // TESTED https://polkadot.subscan.io/xcm_message/polkadot-f2b697df74ebe4b62853fe81b8b7d0522464972d
    const section =
      input.scenario === 'ParaToPara' ? 'reserveTransferAssets' : 'reserveWithdrawAssets'
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, section)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currencyID } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID)
  }

  protected canUseXTokens({ currencySymbol, currencyId }: TSendInternalOptions): boolean {
    return currencySymbol !== this.getNativeAssetSymbol() || !!currencyId
  }
}

export default Astar
