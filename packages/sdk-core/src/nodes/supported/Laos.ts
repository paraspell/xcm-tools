// Contains detailed structure of XCM call construction for Laos Parachain

import { InvalidCurrencyError } from '@paraspell/assets'
import type { TEcosystemType, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import {
  NodeNotSupportedError,
  ScenarioNotSupportedError,
  TransferToAhNotSupported
} from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'

class Laos<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TNodePolkadotKusama = 'Laos',
    info: string = 'laos',
    type: TEcosystemType = 'polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, type, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario, assetInfo: asset, destination } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    if (asset.symbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(`Asset ${asset.symbol} is not supported by node ${this.node}.`)
    }

    if (destination === 'AssetHubPolkadot') {
      throw new TransferToAhNotSupported('Transfer from Laos to AssetHubPolkadot is not supported.')
    }

    return transferPolkadotXcm(input, 'limited_reserve_transfer_assets', 'Unlimited')
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default Laos
