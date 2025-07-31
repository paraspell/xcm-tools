// Contains detailed structure of XCM call construction for the IntegriteeKusama Parachain

import { InvalidCurrencyError } from '@paraspell/assets'
import type { TEcosystemType, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import type { TSerializedApiCall, TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import ParachainNode from '../ParachainNode'

class IntegriteeKusama<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor(
    chain: TNodePolkadotKusama = 'IntegriteeKusama',
    info: string = 'integritee',
    type: TEcosystemType = 'kusama',
    version: Version = Version.V4
  ) {
    super(chain, info, type, version)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset, scenario } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    if (asset.symbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(
        `Asset ${asset.symbol} is not supported by chain ${this.node}.`
      )
    }

    return transferXTokens(input, asset.symbol)
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    assertHasId(asset)

    return api.callTxMethod({
      module: 'Assets',
      method: 'transfer',
      parameters: {
        id: Number(asset.assetId),
        target: { Id: address },
        amount: asset.amount
      }
    })
  }
}

export default IntegriteeKusama
