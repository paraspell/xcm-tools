// Contains detailed structure of XCM call construction for KiltSpiritnet Parachain

import type { TEcosystemType, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'

class KiltSpiritnet<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TNodePolkadotKusama = 'KiltSpiritnet',
    info: string = 'kilt',
    type: TEcosystemType = 'polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, type, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario, asset } = input

    if (scenario === 'ParaToPara' && asset.symbol !== this.getNativeAssetSymbol()) {
      throw new ScenarioNotSupportedError(
        this.node,
        scenario,
        'KiltSpiritnet only supports native asset ParaToPara transfers'
      )
    }

    return transferPolkadotXcm(input, 'limited_reserve_transfer_assets', 'Unlimited')
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default KiltSpiritnet
