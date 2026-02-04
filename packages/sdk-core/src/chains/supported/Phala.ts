import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTransfer } from '../../pallets/xTransfer'
import type { TTransferLocalOptions } from '../../types'
import { type IXTransferTransfer, type TXTransferTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import Chain from '../Chain'

class Phala<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IXTransferTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('Phala', 'phala', 'Polkadot', Version.V3)
  }

  transferXTransfer(input: TXTransferTransferOptions<TApi, TRes, TSigner>) {
    const { asset } = input
    if (asset.symbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(
        `Chain ${this.chain} does not support currency ${asset.symbol}`
      )
    }
    return transferXTransfer(input)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    const { api, assetInfo: asset, address, isAmountAll, keepAlive } = options

    assertHasId(asset)

    const assetId = BigInt(asset.assetId)
    const dest = { Id: address }

    const amount = isAmountAll ? options.balance : asset.amount

    return api.deserializeExtrinsics({
      module: 'Assets',
      method: keepAlive ? 'transfer_keep_alive' : 'transfer',
      params: {
        id: assetId,
        target: dest,
        amount
      }
    })
  }
}

export default Phala
