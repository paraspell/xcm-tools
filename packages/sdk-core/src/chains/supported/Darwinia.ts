// Contains detailed structure of XCM call construction for Darwinia Parachain

import type { TAssetInfo } from '@paraspell/assets'
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
import { createAsset } from '../../utils/asset'
import Parachain from '../Parachain'

class Darwinia<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Darwinia', 'darwinia', 'polkadot', Version.V4)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario, assetInfo: asset } = input

    if (scenario === 'ParaToPara' && asset.symbol !== this.getNativeAssetSymbol()) {
      throw new ScenarioNotSupportedError(this.chain, scenario)
    }

    return transferPolkadotXcm(input, 'limited_reserve_transfer_assets', 'Unlimited')
  }

  createCurrencySpec(amount: bigint, scenario: TScenario, version: Version, _asset?: TAssetInfo) {
    if (scenario === 'ParaToPara') {
      return createAsset(version, amount, {
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
    const { api, assetInfo: asset, address } = options

    assertHasId(asset)

    return api.callTxMethod({
      module: 'Assets',
      method: 'transfer',
      parameters: {
        id: BigInt(asset.assetId),
        target: address,
        amount: asset.amount
      }
    })
  }
}

export default Darwinia
