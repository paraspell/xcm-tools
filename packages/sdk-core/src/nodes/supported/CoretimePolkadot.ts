// Contains detailed structure of XCM call construction for CoretimePolkadot Parachain

import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import type { TRelayToParaOverrides } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions, Version } from '../../types'
import ParachainNode from '../ParachainNode'

class CoretimePolkadot<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IPolkadotXCMTransfer
{
  constructor() {
    super('CoretimePolkadot', 'polkadotCoretime', 'polkadot', Version.V3)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario } = input
    const section =
      scenario === 'ParaToPara' ? 'limited_reserve_transfer_assets' : 'limited_teleport_assets'
    return Promise.resolve(PolkadotXCMTransferImpl.transferPolkadotXCM(input, section, 'Unlimited'))
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { section: 'limited_teleport_assets', includeFee: true }
  }
}

export default CoretimePolkadot
