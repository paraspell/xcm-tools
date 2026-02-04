// Contains detailed structure of XCM call construction for Manta Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TMantaAsset, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import Chain from '../Chain'

class Manta<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IXTokensTransfer<TApi, TRes, TSigner>
{
  static readonly NATIVE_ASSET_ID = 1n

  constructor() {
    super('Manta', 'manta', 'Polkadot', Version.V3)
  }

  private getAssetId(asset: TAssetInfo) {
    if (asset.symbol === this.getNativeAssetSymbol()) return Manta.NATIVE_ASSET_ID

    assertHasId(asset)

    return BigInt(asset.assetId)
  }

  transferXTokens(input: TXTokensTransferOptions<TApi, TRes, TSigner>) {
    const { asset } = input

    const currencySelection: TMantaAsset = {
      MantaCurrency: this.getAssetId(asset)
    }

    return transferXTokens(input, currencySelection)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    const { api, assetInfo: asset, address, balance, isAmountAll, keepAlive } = options

    assertHasId(asset)

    const assetId = BigInt(asset.assetId)

    const amount = isAmountAll ? balance : asset.amount

    return api.deserializeExtrinsics({
      module: 'Assets',
      method: keepAlive ? 'transfer_keep_alive' : 'transfer',
      params: {
        id: assetId,
        target: { Id: address },
        amount
      }
    })
  }
}

export default Manta
