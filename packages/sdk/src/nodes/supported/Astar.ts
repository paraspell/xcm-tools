// Contains detailed structure of XCM call construction for Astar Parachain

import {
  Version,
  type Extrinsic,
  type IPolkadotXCMTransfer,
  type IXTokensTransfer,
  type PolkadotXCMTransferInput,
  type TSendInternalOptions,
  type TSerializedApiCall,
  type XTokensTransferInput
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Astar extends ParachainNode implements IPolkadotXCMTransfer, IXTokensTransfer {
  constructor() {
    super('Astar', 'astar', 'polkadot', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic | TSerializedApiCall {
    // TESTED https://polkadot.subscan.io/xcm_message/polkadot-f2b697df74ebe4b62853fe81b8b7d0522464972d
    const method =
      input.scenario === 'ParaToPara' ? 'reserveTransferAssets' : 'reserveWithdrawAssets'
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, method)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    return XTokensTransferImpl.transferXTokens(input, input.currencyID)
  }

  protected canUseXTokens({ currencySymbol, currencyId }: TSendInternalOptions): boolean {
    return currencySymbol !== 'ASTR' && !!currencyId
  }
}

export default Astar
