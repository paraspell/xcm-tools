// Contains detailed structure of XCM call construction for Darwinia Parachain

import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { assertHasId } from '../../utils'
import Chain from '../Chain'

class Darwinia<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('Darwinia', 'darwinia', 'Polkadot', Version.V4)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    const { scenario, assetInfo: asset } = input

    if (scenario === 'ParaToPara' && asset.symbol !== this.getNativeAssetSymbol()) {
      throw new ScenarioNotSupportedError({ chain: this.chain, scenario })
    }

    return transferPolkadotXcm(input)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    const { api, assetInfo: asset, address, isAmountAll } = options

    assertHasId(asset)

    const assetId = BigInt(asset.assetId)

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          id: assetId,
          dest: address,
          keep_alive: false
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Assets',
      method: 'transfer',
      params: {
        id: assetId,
        target: address,
        amount: asset.amount
      }
    })
  }
}

export default Darwinia
