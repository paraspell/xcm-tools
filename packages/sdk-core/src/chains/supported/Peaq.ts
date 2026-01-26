// Contains detailed structure of XCM call construction for Peaq Parachain

import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import Chain from '../Chain'

class Peaq<TApi, TRes> extends Chain<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Peaq', 'peaq', 'Polkadot', Version.V4)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { scenario, asset } = input
    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError({ chain: this.chain, scenario })
    }

    assertHasId(asset)

    return transferXTokens(input, BigInt(asset.assetId))
  }

  isRelayToParaEnabled(): boolean {
    return false
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address, isAmountAll } = options

    assertHasId(asset)

    const assetId = BigInt(asset.assetId)
    const dest = { Id: address }

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          id: assetId,
          dest,
          keep_alive: false
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Assets',
      method: 'transfer',
      params: {
        id: assetId,
        target: dest,
        amount: asset.amount
      }
    })
  }
}

export default Peaq
