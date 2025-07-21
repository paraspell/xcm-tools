// Contains detailed structure of XCM call construction for Darwinia Parachain

import type { TAsset } from '@paraspell/assets'
import { Parents, Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TScenario,
  TTransferLocalOptions
} from '../../types'
import { assertHasId } from '../../utils'
import { createMultiAsset } from '../../utils/multiAsset'
import ParachainNode from '../ParachainNode'

class Darwinia<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Darwinia', 'darwinia', 'polkadot', Version.V4)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario, asset } = input

    if (scenario === 'ParaToPara' && asset.symbol !== this.getNativeAssetSymbol()) {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    return transferPolkadotXcm(input, 'limited_reserve_transfer_assets', 'Unlimited')
  }

  createCurrencySpec(amount: bigint, scenario: TScenario, version: Version, _asset?: TAsset) {
    if (scenario === 'ParaToPara') {
      return createMultiAsset(version, amount, {
        parents: Parents.ZERO,
        interior: {
          X1: {
            PalletInstance: 5
          }
        }
      })
    } else {
      return super.createCurrencySpec(amount, scenario, version)
    }
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    assertHasId(asset)

    return api.callTxMethod({
      module: 'Assets',
      method: 'transfer',
      parameters: {
        id: BigInt(asset.assetId),
        target: address,
        amount: BigInt(asset.amount)
      }
    })
  }
}

export default Darwinia
