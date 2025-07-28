// Contains detailed structure of XCM call construction for Nodle Parachain

import { InvalidCurrencyError } from '@paraspell/assets'
import type { TEcosystemType, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TPolkadotXCMTransferOptions } from '../../types'
import { type TSerializedApiCall } from '../../types'
import ParachainNode from '../ParachainNode'

class Nodle<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TNodePolkadotKusama = 'Nodle',
    info: string = 'nodle',
    type: TEcosystemType = 'polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, type, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { assetInfo: asset, scenario } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    if (asset.symbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(`Asset ${asset.symbol} is not supported by node ${this.node}.`)
    }

    return transferPolkadotXcm(input, 'limited_reserve_transfer_assets', 'Unlimited')
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default Nodle
