// Contains detailed structure of XCM call construction for Manta Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TMantaAsset, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import Parachain from '../Parachain'

class Manta<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  static readonly NATIVE_ASSET_ID = 1n

  constructor() {
    super('Manta', 'manta', 'polkadot', Version.V3)
  }

  private getAssetId(asset: TAssetInfo) {
    if (asset.symbol === this.getNativeAssetSymbol()) return Manta.NATIVE_ASSET_ID

    assertHasId(asset)

    return BigInt(asset.assetId)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    const currencySelection: TMantaAsset = {
      MantaCurrency: this.getAssetId(asset)
    }

    return transferXTokens(input, currencySelection)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address } = options

    assertHasId(asset)

    return api.callTxMethod({
      module: 'Assets',
      method: 'transfer',
      parameters: {
        id: BigInt(asset.assetId),
        target: { Id: address },
        amount: asset.amount
      }
    })
  }
}

export default Manta
