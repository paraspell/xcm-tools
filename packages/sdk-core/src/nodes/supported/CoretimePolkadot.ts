// Contains detailed structure of XCM call construction for CoretimePolkadot Parachain

import type { TEcosystemType, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TRelayToParaOverrides } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import ParachainNode from '../ParachainNode'

class CoretimePolkadot<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IPolkadotXCMTransfer
{
  constructor(
    chain: TNodePolkadotKusama = 'CoretimePolkadot',
    info: string = 'polkadotCoretime',
    type: TEcosystemType = 'polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, type, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario } = input
    const method =
      scenario === 'ParaToPara' ? 'limited_reserve_transfer_assets' : 'limited_teleport_assets'
    return transferPolkadotXcm(input, method, 'Unlimited')
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { method: 'limited_teleport_assets', includeFee: true }
  }
}

export default CoretimePolkadot
