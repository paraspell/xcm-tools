// Contains detailed structure of XCM call construction for Ajuna Parachain on Polkadot

import { InvalidCurrencyError } from '@paraspell/assets'
import type { TEcosystemType, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import { createTypeAndThenCall } from '../../transfer'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TSerializedApiCall,
  TTransferLocalOptions
} from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import ParachainNode from '../ParachainNode'

class Ajuna<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IXTokensTransfer, IPolkadotXCMTransfer
{
  constructor(
    chain: TNodePolkadotKusama = 'Ajuna',
    info: string = 'ajuna',
    type: TEcosystemType = 'polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, type, version)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { scenario, asset } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    if (asset.symbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(`Asset ${asset.symbol} is not supported by node ${this.node}.`)
    }

    return transferXTokens(input, this.getNativeAssetSymbol())
  }

  async transferPolkadotXCM<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api } = input
    return api.callTxMethod(await createTypeAndThenCall(this.node, input))
  }

  canUseXTokens({ asset, to: destination }: TSendInternalOptions<TApi, TRes>): boolean {
    return !(asset.symbol === 'DOT' && destination === 'AssetHubPolkadot')
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

export default Ajuna
