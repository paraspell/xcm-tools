// Contains detailed structure of XCM call construction for OriginTrail Parachain

import type { TEcosystemType, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import ParachainNode from '../ParachainNode'

class NeuroWeb<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TNodePolkadotKusama = 'NeuroWeb',
    info: string = 'neuroweb',
    type: TEcosystemType = 'polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, type, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    return transferPolkadotXcm(input, 'limited_reserve_transfer_assets', 'Unlimited')
  }
}

export default NeuroWeb
